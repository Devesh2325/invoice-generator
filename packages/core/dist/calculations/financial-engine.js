import { Decimal } from 'decimal.js';
import { getCurrencyConfig } from '../types/currency';
// Configure Decimal for deterministic financial accuracy
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
/**
 * Deterministically rounds a Decimal to the currency's decimal precision.
 */
export function roundToCurrency(val, decimalPlaces) {
    return val.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
}
export function calculateDocument(input) {
    const currency = input.currency || 'USD';
    const currencyConfig = getCurrencyConfig(currency);
    const dp = currencyConfig.decimalPlaces;
    let totalGross = new Decimal(0);
    let totalLineDiscounts = new Decimal(0);
    let rawTaxableSubtotal = new Decimal(0);
    const calculatedItems = [];
    const taxBuckets = new Map();
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
        }
        else if (raw.discountType === 'fixed') {
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
            }
            else {
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
        calculatedItems.push({
            ...raw,
            id: raw.id || `item_${i + 1}`,
            quantity: qty.toNumber(),
            unitPrice: roundToCurrency(unitPrice, dp).toNumber(),
            lineGross: roundToCurrency(gross, dp).toNumber(),
            lineDiscount: roundToCurrency(lineDisc, dp).toNumber(),
            lineNet: roundToCurrency(lineNet, dp).toNumber(),
            taxAmount: roundToCurrency(lineTax, dp).toNumber(),
            lineTotal: roundToCurrency(lineTotal, dp).toNumber(),
        });
    }
    // Step 2: Document-Level Discount
    let docDiscount = new Decimal(0);
    const docDiscVal = new Decimal(Math.max(0, input.documentDiscountValue || 0));
    if (input.documentDiscountType === 'percentage') {
        docDiscount = rawTaxableSubtotal.times(docDiscVal.dividedBy(100));
    }
    else if (input.documentDiscountType === 'fixed') {
        docDiscount = Decimal.min(rawTaxableSubtotal, docDiscVal);
    }
    docDiscount = Decimal.min(rawTaxableSubtotal, docDiscount);
    // If there is document-level discount, reduce taxable base proportionally across tax buckets
    let totalTax = new Decimal(0);
    const taxBreakdown = [];
    const discountRatio = rawTaxableSubtotal.greaterThan(0)
        ? docDiscount.dividedBy(rawTaxableSubtotal)
        : new Decimal(0);
    taxBuckets.forEach((bucket, rate) => {
        // Proportional taxable reduction from document discount
        const adjustedTaxable = bucket.taxable.times(new Decimal(1).minus(discountRatio));
        const adjustedTax = adjustedTaxable.times(new Decimal(rate).dividedBy(100));
        totalTax = totalTax.plus(adjustedTax);
        taxBreakdown.push({
            rate,
            taxableAmount: roundToCurrency(adjustedTaxable, dp).toNumber(),
            taxAmount: roundToCurrency(adjustedTax, dp).toNumber(),
        });
    });
    const totalDiscount = totalLineDiscounts.plus(docDiscount);
    const taxableSubtotal = Decimal.max(0, rawTaxableSubtotal.minus(docDiscount));
    const shipping = new Decimal(Math.max(0, input.shippingFee || 0));
    const extra = new Decimal(Math.max(0, input.extraCharges || 0));
    const grandTotal = taxableSubtotal.plus(totalTax).plus(shipping).plus(extra);
    const paid = new Decimal(Math.max(0, input.amountPaid || 0));
    const balanceDue = Decimal.max(0, grandTotal.minus(paid));
    const summary = {
        subtotal: roundToCurrency(totalGross, dp).toNumber(),
        discountTotal: roundToCurrency(totalDiscount, dp).toNumber(),
        taxableSubtotal: roundToCurrency(taxableSubtotal, dp).toNumber(),
        totalTax: roundToCurrency(totalTax, dp).toNumber(),
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
