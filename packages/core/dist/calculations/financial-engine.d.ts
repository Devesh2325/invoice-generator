import { Decimal } from 'decimal.js';
import { DocumentLineItemInput, CalculatedLineItem, DocumentCalculatedSummary, DiscountType, RoundingMode } from '../types/document';
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
export declare function getDecimalRoundingMode(mode?: RoundingMode): Decimal.Rounding;
/**
 * Deterministically rounds a Decimal to the currency's decimal precision.
 */
export declare function roundToCurrency(val: Decimal, decimalPlaces: number, roundingMode?: Decimal.Rounding): Decimal;
export declare function calculateDocument(input: CalculationInput): CalculationResult;
