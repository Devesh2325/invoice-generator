import { Decimal } from 'decimal.js';
import { DocumentLineItemInput, CalculatedLineItem, DocumentCalculatedSummary, DiscountType } from '../types/document';
export interface CalculationInput {
    currency?: string;
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
export declare function roundToCurrency(val: Decimal, decimalPlaces: number): Decimal;
export declare function calculateDocument(input: CalculationInput): CalculationResult;
