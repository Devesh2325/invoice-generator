import { Decimal } from 'decimal.js';
import {
  DocumentLineItemInput,
  CalculatedLineItem,
  DocumentCalculatedSummary,
  TaxBreakdownItem,
  DiscountType,
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
}

export interface CalculationResult {
  items: CalculatedLineItem[];
  summary: DocumentCalculatedSummary;
}

/**
 * Deterministically rounds a Decimal to the currency's decimal precision.
 */
export function roundToCurrency(val: Decimal, decimalPlaces: number): Decimal {
  return val.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
}

export function calculateDocument(input: CalculationInput): CalculationResult {
  const currency = input.currency || 'USD';
  const currencyConfig = getCurrencyConfig(currency);
  const dp = currencyConfig.decimalPlaces;

  const sState = (input.senderState || '').trim().toLowerCase();
  const cState = (input.clientState || '').trim().toLowerCase();
  const isInterState = Boolean(sState && cState && sState !== cState);
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
    // Cap discount at gross
    lineDisc = Decimal.min(gross, lineDisc);

    const netBeforeTax = gross.minus(lineDisc);

    // Tax calculation
    const taxRate = new Decimal(Math.max(0, raw.taxRate || 0));
    let lineNet = netBeforeTax;
    let lineTax = new Decimal(0);

    if (taxRate.greaterThan(0)) {
      if (raw.taxInclusive) {
        // Price includes tax: Net = Gross / (1 + r), Tax = Gross - Net
        const rateFactor = taxRate.dividedBy(100).plus(1);
        lineNet = netBeforeTax.dividedBy(rateFactor);
        lineTax = netBeforeTax.minus(lineNet);
      } else {
        // Price excludes tax: Tax = Net * r
        lineTax = netBeforeTax.times(taxRate.dividedBy(100));
      }
    }

    const lineTotal = raw.taxInclusive
      ? netBeforeTax
      : lineNet.plus(lineTax);

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

    const roundedLineTax = roundToCurrency(lineTax, dp);
    const halfTax = roundToCurrency(roundedLineTax.dividedBy(2), dp);
    const otherHalfTax = roundToCurrency(roundedLineTax.minus(halfTax), dp);

    calculatedItems.push({
      ...raw,
      id: raw.id || `item_${i + 1}`,
      quantity: qty.toNumber(),
      unitPrice: roundToCurrency(unitPrice, dp).toNumber(),
      lineGross: roundToCurrency(gross, dp).toNumber(),
      lineDiscount: roundToCurrency(lineDisc, dp).toNumber(),
      lineNet: roundToCurrency(lineNet, dp).toNumber(),
      taxAmount: roundedLineTax.toNumber(),
      cgstRate: isInterState ? 0 : rateKey / 2,
      cgstAmount: isInterState ? 0 : halfTax.toNumber(),
      sgstRate: isInterState ? 0 : rateKey / 2,
      sgstAmount: isInterState ? 0 : otherHalfTax.toNumber(),
      igstRate: isInterState ? rateKey : 0,
      igstAmount: isInterState ? roundedLineTax.toNumber() : 0,
      lineTotal: roundToCurrency(lineTotal, dp).toNumber(),
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

  // If there is document-level discount, reduce taxable base proportionally across tax buckets
  let totalTax = new Decimal(0);
  let cgstTotal = new Decimal(0);
  let sgstTotal = new Decimal(0);
  let igstTotal = new Decimal(0);
  const taxBreakdown: TaxBreakdownItem[] = [];

  const discountRatio = rawTaxableSubtotal.greaterThan(0)
    ? docDiscount.dividedBy(rawTaxableSubtotal)
    : new Decimal(0);

  taxBuckets.forEach((bucket, rate) => {
    // Proportional taxable reduction from document discount
    const adjustedTaxable = bucket.taxable.times(new Decimal(1).minus(discountRatio));
    const adjustedTax = roundToCurrency(adjustedTaxable.times(new Decimal(rate).dividedBy(100)), dp);
    totalTax = totalTax.plus(adjustedTax);

    const halfBucketTax = roundToCurrency(adjustedTax.dividedBy(2), dp);
    const secondHalfBucketTax = roundToCurrency(adjustedTax.minus(halfBucketTax), dp);

    if (isInterState) {
      igstTotal = igstTotal.plus(adjustedTax);
    } else {
      cgstTotal = cgstTotal.plus(halfBucketTax);
      sgstTotal = sgstTotal.plus(secondHalfBucketTax);
    }

    taxBreakdown.push({
      rate,
      taxableAmount: roundToCurrency(adjustedTaxable, dp).toNumber(),
      taxAmount: adjustedTax.toNumber(),
      cgstRate: isInterState ? 0 : rate / 2,
      cgstAmount: isInterState ? 0 : halfBucketTax.toNumber(),
      sgstRate: isInterState ? 0 : rate / 2,
      sgstAmount: isInterState ? 0 : secondHalfBucketTax.toNumber(),
      igstRate: isInterState ? rate : 0,
      igstAmount: isInterState ? adjustedTax.toNumber() : 0,
    });
  });

  const totalDiscount = totalLineDiscounts.plus(docDiscount);
  const taxableSubtotal = Decimal.max(0, rawTaxableSubtotal.minus(docDiscount));
  const shipping = new Decimal(Math.max(0, input.shippingFee || 0));
  const extra = new Decimal(Math.max(0, input.extraCharges || 0));

  const grandTotal = taxableSubtotal.plus(totalTax).plus(shipping).plus(extra);
  const paid = new Decimal(Math.max(0, input.amountPaid || 0));
  const balanceDue = Decimal.max(0, grandTotal.minus(paid));

  const summary: DocumentCalculatedSummary = {
    subtotal: roundToCurrency(totalGross, dp).toNumber(),
    discountTotal: roundToCurrency(totalDiscount, dp).toNumber(),
    taxableSubtotal: roundToCurrency(taxableSubtotal, dp).toNumber(),
    totalTax: roundToCurrency(totalTax, dp).toNumber(),
    gstSupplyType,
    cgstTotal: roundToCurrency(cgstTotal, dp).toNumber(),
    sgstTotal: roundToCurrency(sgstTotal, dp).toNumber(),
    igstTotal: roundToCurrency(igstTotal, dp).toNumber(),
    taxBreakdown,
    shippingFee: roundToCurrency(shipping, dp).toNumber(),
    extraCharges: roundToCurrency(extra, dp).toNumber(),
    grandTotal: roundToCurrency(grandTotal, dp).toNumber(),
    amountPaid: roundToCurrency(paid, dp).toNumber(),
    balanceDue: roundToCurrency(balanceDue, dp).toNumber(),
  };

  return {
    items: calculatedItems,
    summary,
  };
}
