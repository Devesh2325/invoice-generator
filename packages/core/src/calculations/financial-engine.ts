import { Decimal } from 'decimal.js';
import {
  DocumentLineItemInput,
  CalculatedLineItem,
  DocumentCalculatedSummary,
  TaxBreakdownItem,
  DiscountType,
  RoundingMode,
} from '../types/document';
import { getCurrencyConfig } from '../types/currency';

// Configure Decimal for deterministic financial accuracy
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface CalculationInput {
  currency?: string;
  senderState?: string;
  clientState?: string;
  items: DocumentLineItemInput[];
  documentDiscountType?: DiscountType;
  documentDiscountValue?: number;
  shippingFee?: number;
  extraCharges?: number;
  amountPaid?: number;
  refundedAmount?: number;
  enableRoundOff?: boolean;
  roundingMode?: RoundingMode;
  decimalPrecision?: number;
}

export interface CalculationResult {
  items: CalculatedLineItem[];
  summary: DocumentCalculatedSummary;
}

export function getDecimalRoundingMode(mode?: RoundingMode): Decimal.Rounding {
  switch (mode) {
    case 'half_even':
      return Decimal.ROUND_HALF_EVEN;
    case 'up':
      return Decimal.ROUND_CEIL;
    case 'down':
      return Decimal.ROUND_FLOOR;
    case 'nearest_integer':
    case 'half_up':
    default:
      return Decimal.ROUND_HALF_UP;
  }
}

/**
 * Deterministically rounds a Decimal to the currency's decimal precision.
 */
export function roundToCurrency(
  val: Decimal,
  decimalPlaces: number,
  roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
): Decimal {
  return val.toDecimalPlaces(decimalPlaces, roundingMode);
}

export function calculateDocument(input: CalculationInput): CalculationResult {
  const currency = input.currency || 'INR';
  const currencyConfig = getCurrencyConfig(currency);
  const dp =
    input.decimalPrecision !== undefined && input.decimalPrecision >= 0
      ? input.decimalPrecision
      : currencyConfig.decimalPlaces;

  const roundingModeEnum = getDecimalRoundingMode(input.roundingMode);

  const sState = (input.senderState || '').trim().toLowerCase();
  const cState = (input.clientState || '').trim().toLowerCase();
  const isIndiaCurrency = (currency || 'INR').toUpperCase() === 'INR';
  const isInterState = isIndiaCurrency && Boolean(sState && cState && sState !== cState);
  const gstSupplyType: 'intra' | 'inter' = isInterState ? 'inter' : 'intra';

  let totalGross = new Decimal(0);
  let totalLineDiscounts = new Decimal(0);
  let rawTaxableSubtotal = new Decimal(0);

  const calculatedItems: CalculatedLineItem[] = [];
  const taxBuckets = new Map<number, { taxable: Decimal; tax: Decimal }>();

  // Step 1: Process each line item
  for (let i = 0; i < input.items.length; i++) {
    const raw = input.items[i];
    const qty = new Decimal(Math.max(0, raw.quantity || 0));
    const unitPrice = new Decimal(Math.max(0, raw.unitPrice || 0));
    const gross = qty.times(unitPrice);

    // Line Discount
    let lineDisc = new Decimal(0);
    const discVal = new Decimal(Math.max(0, raw.discountValue || 0));
    if (raw.discountType === 'percentage') {
      const pct = discVal.dividedBy(100);
      lineDisc = gross.times(pct);
    } else if (raw.discountType === 'fixed') {
      lineDisc = Decimal.min(gross, discVal);
    }
    lineDisc = Decimal.min(gross, lineDisc);

    const netBeforeTax = gross.minus(lineDisc);

    // Tax calculation
    const taxRate = new Decimal(Math.max(0, raw.taxRate || 0));
    let lineNet = netBeforeTax;
    let lineTax = new Decimal(0);

    if (taxRate.greaterThan(0)) {
      if (raw.taxInclusive) {
        const rateFactor = taxRate.dividedBy(100).plus(1);
        lineNet = netBeforeTax.dividedBy(rateFactor);
        lineTax = netBeforeTax.minus(lineNet);
      } else {
        lineTax = netBeforeTax.times(taxRate.dividedBy(100));
      }
    }

    const lineTotal = raw.taxInclusive ? netBeforeTax : lineNet.plus(lineTax);

    totalGross = totalGross.plus(gross);
    totalLineDiscounts = totalLineDiscounts.plus(lineDisc);
    rawTaxableSubtotal = rawTaxableSubtotal.plus(lineNet);

    // Record into tax bucket
    const rateKey = taxRate.toNumber();
    if (rateKey > 0) {
      const existing = taxBuckets.get(rateKey) || {
        taxable: new Decimal(0),
        tax: new Decimal(0),
      };
      existing.taxable = existing.taxable.plus(lineNet);
      existing.tax = existing.tax.plus(lineTax);
      taxBuckets.set(rateKey, existing);
    }

    const roundedLineTax = roundToCurrency(lineTax, dp, roundingModeEnum);
    const halfTax = roundToCurrency(roundedLineTax.dividedBy(2), dp, roundingModeEnum);
    const otherHalfTax = roundToCurrency(roundedLineTax.minus(halfTax), dp, roundingModeEnum);

    calculatedItems.push({
      ...raw,
      id: raw.id || `item_${i + 1}`,
      quantity: qty.toNumber(),
      unitPrice: roundToCurrency(unitPrice, dp, roundingModeEnum).toNumber(),
      lineGross: roundToCurrency(gross, dp, roundingModeEnum).toNumber(),
      lineDiscount: roundToCurrency(lineDisc, dp, roundingModeEnum).toNumber(),
      lineNet: roundToCurrency(lineNet, dp, roundingModeEnum).toNumber(),
      taxAmount: roundedLineTax.toNumber(),
      cgstRate: isIndiaCurrency ? (isInterState ? 0 : rateKey / 2) : 0,
      cgstAmount: isIndiaCurrency ? (isInterState ? 0 : halfTax.toNumber()) : 0,
      sgstRate: isIndiaCurrency ? (isInterState ? 0 : rateKey / 2) : 0,
      sgstAmount: isIndiaCurrency ? (isInterState ? 0 : otherHalfTax.toNumber()) : 0,
      igstRate: isIndiaCurrency ? (isInterState ? rateKey : 0) : 0,
      igstAmount: isIndiaCurrency ? (isInterState ? roundedLineTax.toNumber() : 0) : 0,
      lineTotal: roundToCurrency(lineTotal, dp, roundingModeEnum).toNumber(),
    });
  }

  // Step 2: Document-Level Discount
  let docDiscount = new Decimal(0);
  const docDiscVal = new Decimal(Math.max(0, input.documentDiscountValue || 0));
  if (input.documentDiscountType === 'percentage') {
    docDiscount = rawTaxableSubtotal.times(docDiscVal.dividedBy(100));
  } else if (input.documentDiscountType === 'fixed') {
    docDiscount = Decimal.min(rawTaxableSubtotal, docDiscVal);
  }
  docDiscount = Decimal.min(rawTaxableSubtotal, docDiscount);

  // Proportional taxable reduction across tax buckets
  let totalTax = new Decimal(0);
  let cgstTotal = new Decimal(0);
  let sgstTotal = new Decimal(0);
  let igstTotal = new Decimal(0);
  const taxBreakdown: TaxBreakdownItem[] = [];

  const discountRatio = rawTaxableSubtotal.greaterThan(0)
    ? docDiscount.dividedBy(rawTaxableSubtotal)
    : new Decimal(0);

  taxBuckets.forEach((bucket, rate) => {
    const adjustedTaxable = bucket.taxable.times(new Decimal(1).minus(discountRatio));
    const adjustedTax = roundToCurrency(
      adjustedTaxable.times(new Decimal(rate).dividedBy(100)),
      dp,
      roundingModeEnum
    );
    totalTax = totalTax.plus(adjustedTax);

    const halfBucketTax = roundToCurrency(adjustedTax.dividedBy(2), dp, roundingModeEnum);
    const secondHalfBucketTax = roundToCurrency(
      adjustedTax.minus(halfBucketTax),
      dp,
      roundingModeEnum
    );

    if (isIndiaCurrency) {
      if (isInterState) {
        igstTotal = igstTotal.plus(adjustedTax);
      } else {
        cgstTotal = cgstTotal.plus(halfBucketTax);
        sgstTotal = sgstTotal.plus(secondHalfBucketTax);
      }
    }

    taxBreakdown.push({
      rate,
      taxableAmount: roundToCurrency(adjustedTaxable, dp, roundingModeEnum).toNumber(),
      taxAmount: adjustedTax.toNumber(),
      cgstRate: isIndiaCurrency && !isInterState ? rate / 2 : 0,
      cgstAmount: isIndiaCurrency && !isInterState ? halfBucketTax.toNumber() : 0,
      sgstRate: isIndiaCurrency && !isInterState ? rate / 2 : 0,
      sgstAmount: isIndiaCurrency && !isInterState ? secondHalfBucketTax.toNumber() : 0,
      igstRate: isIndiaCurrency && isInterState ? rate : 0,
      igstAmount: isIndiaCurrency && isInterState ? adjustedTax.toNumber() : 0,
    });
  });

  const roundedSubtotal = roundToCurrency(totalGross, dp, roundingModeEnum);
  const roundedDiscount = roundToCurrency(totalLineDiscounts.plus(docDiscount), dp, roundingModeEnum);
  const roundedTaxableSubtotal = roundToCurrency(
    Decimal.max(0, rawTaxableSubtotal.minus(docDiscount)),
    dp,
    roundingModeEnum
  );
  const roundedTotalTax = roundToCurrency(totalTax, dp, roundingModeEnum);
  const roundedShipping = roundToCurrency(new Decimal(Math.max(0, input.shippingFee || 0)), dp, roundingModeEnum);
  const roundedExtra = roundToCurrency(new Decimal(Math.max(0, input.extraCharges || 0)), dp, roundingModeEnum);

  // Exact total before round-off adjustment (derived from rounded components to prevent double-rounding)
  const totalBeforeRoundOff = roundedTaxableSubtotal
    .plus(roundedTotalTax)
    .plus(roundedShipping)
    .plus(roundedExtra);

  // Round-Off calculation (when enabled, rounds final payable to whole currency unit using configured mode)
  let grandTotal = totalBeforeRoundOff;
  let roundOffAmount = new Decimal(0);

  if (input.enableRoundOff) {
    const targetRounded = totalBeforeRoundOff.toDecimalPlaces(0, roundingModeEnum);
    roundOffAmount = roundToCurrency(targetRounded.minus(totalBeforeRoundOff), dp, roundingModeEnum);
    grandTotal = targetRounded;
  }

  const paid = roundToCurrency(new Decimal(Math.max(0, input.amountPaid || 0)), dp, roundingModeEnum);
  const refunded = roundToCurrency(
    new Decimal(Math.max(0, input.refundedAmount || 0)),
    dp,
    roundingModeEnum
  );
  const netPaid = Decimal.max(0, paid.minus(refunded));
  const balanceDue = Decimal.max(0, grandTotal.minus(paid));

  const summary: DocumentCalculatedSummary = {
    subtotal: roundedSubtotal.toNumber(),
    discountTotal: roundedDiscount.toNumber(),
    taxableSubtotal: roundedTaxableSubtotal.toNumber(),
    totalTax: roundedTotalTax.toNumber(),
    gstSupplyType,
    cgstTotal: roundToCurrency(cgstTotal, dp, roundingModeEnum).toNumber(),
    sgstTotal: roundToCurrency(sgstTotal, dp, roundingModeEnum).toNumber(),
    igstTotal: roundToCurrency(igstTotal, dp, roundingModeEnum).toNumber(),
    taxBreakdown,
    shippingFee: roundedShipping.toNumber(),
    extraCharges: roundedExtra.toNumber(),
    totalBeforeRoundOff: totalBeforeRoundOff.toNumber(),
    roundOffAmount: roundOffAmount.toNumber(),
    grandTotal: grandTotal.toNumber(),
    amountPaid: paid.toNumber(),
    refundedAmount: refunded.toNumber(),
    netAmountPaid: netPaid.toNumber(),
    balanceDue: balanceDue.toNumber(),
  };

  return {
    items: calculatedItems,
    summary,
  };
}
