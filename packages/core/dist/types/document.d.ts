export declare class TenantAccessDeniedError extends Error {
    status: number;
    constructor(message?: string);
}
export declare class PlanLimitReachedError extends Error {
    status: number;
    limit: number;
    current: number;
    constructor(message?: string, limit?: number, current?: number);
}
export type DocumentType = 'invoice' | 'estimate' | 'purchase_order' | 'receipt' | 'credit_note' | 'debit_note' | 'pro_forma';
export type DocumentStatus = 'draft' | 'pending' | 'finalized' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'archived';
export type DiscountType = 'percentage' | 'fixed';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other';
export type RoundingMode = 'nearest_integer' | 'half_up' | 'half_even' | 'up' | 'down';
export type BankAccountType = 'current' | 'savings' | 'checking' | 'business' | 'other';
export interface BankAccountDetails {
    id: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    confirmAccountNumber?: string;
    ifscOrRoutingCode: string;
    branchName?: string;
    accountType: BankAccountType;
    swiftBicCode?: string;
    country?: string;
    isPrimary?: boolean;
}
export interface InvoicePaymentDisplayConfig {
    showBankDetails: boolean;
    showUpiId: boolean;
    showQrCode: boolean;
    showPaymentInstructions: boolean;
    showPaymentTerms: boolean;
}
export interface DocumentPaymentConfig {
    bankAccounts: BankAccountDetails[];
    selectedBankAccountIds?: string[];
    upiId?: string;
    upiPayeeName?: string;
    qrCodeDataUrl?: string;
    autoGenerateUpiQr?: boolean;
    display: InvoicePaymentDisplayConfig;
}
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}
export interface Party {
    id: string;
    tenantId?: string;
    type: 'customer' | 'vendor';
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    billingAddress?: Address;
    shippingAddress?: Address;
    notes?: string;
    isArchived?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface IndianStateInfo {
    code: string;
    name: string;
    label: string;
}
export declare const INDIAN_STATES: IndianStateInfo[];
export interface DocumentLineItemInput {
    id?: string;
    productId?: string;
    description: string;
    hsnCode?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    discountType?: DiscountType;
    discountValue?: number;
    taxRate?: number;
    taxInclusive?: boolean;
}
export interface CalculatedLineItem extends DocumentLineItemInput {
    id: string;
    lineGross: number;
    lineDiscount: number;
    lineNet: number;
    taxAmount: number;
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    igstRate?: number;
    igstAmount?: number;
    lineTotal: number;
}
export interface TaxBreakdownItem {
    rate: number;
    taxableAmount: number;
    taxAmount: number;
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    igstRate?: number;
    igstAmount?: number;
}
export interface DocumentCalculatedSummary {
    subtotal: number;
    discountTotal: number;
    taxableSubtotal: number;
    totalTax: number;
    gstSupplyType?: 'intra' | 'inter';
    cgstTotal?: number;
    sgstTotal?: number;
    igstTotal?: number;
    taxBreakdown: TaxBreakdownItem[];
    shippingFee: number;
    extraCharges: number;
    totalBeforeRoundOff?: number;
    roundOffAmount?: number;
    grandTotal: number;
    amountPaid: number;
    refundedAmount?: number;
    netAmountPaid?: number;
    balanceDue: number;
}
export interface PaymentRecord {
    id: string;
    documentId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    createdAt: string;
}
export interface RefundRecord {
    id: string;
    documentId: string;
    amount: number;
    refundDate: string;
    refundMethod: PaymentMethod;
    reason?: string;
    reference?: string;
    notes?: string;
    createdAt: string;
}
export interface AuditHistoryEntry {
    id: string;
    tenantId?: string;
    action: string;
    description: string;
    actor?: string;
    timestamp: string;
}
export interface DocumentModel {
    id: string;
    tenantId?: string;
    ownerUserId?: string;
    invoiceName?: string;
    type: DocumentType;
    status: DocumentStatus;
    documentNumber: string;
    referenceNumber?: string;
    issueDate: string;
    dueDate?: string;
    currency: string;
    exchangeRate?: number;
    placeOfSupply?: string;
    sender: {
        name: string;
        email?: string;
        phone?: string;
        taxId?: string;
        logoUrl?: string;
        address?: Address;
    };
    client: Party;
    items: CalculatedLineItem[];
    documentDiscountType?: DiscountType;
    documentDiscountValue?: number;
    shippingFee?: number;
    extraCharges?: number;
    enableRoundOff?: boolean;
    roundingMode?: RoundingMode;
    decimalPrecision?: number;
    summary: DocumentCalculatedSummary;
    templateId: string;
    customTheme?: {
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: 'sans' | 'serif' | 'mono';
    };
    paymentConfig?: DocumentPaymentConfig;
    notes?: string;
    paymentTerms?: string;
    paymentInstructions?: string;
    signatoryName?: string;
    payments: PaymentRecord[];
    refunds?: RefundRecord[];
    auditHistory?: AuditHistoryEntry[];
    createdAt: string;
    updatedAt: string;
    finalizedAt?: string;
}
export declare function isValidStatusTransition(from: DocumentStatus, to: DocumentStatus): boolean;
export type CanonicalDocument = DocumentModel;
/**
 * Computes the accurate, consistent invoice status based on due date, payments, and refunds.
 * Partial refunds never mark an invoice as fully refunded.
 */
export declare function computeEffectiveInvoiceStatus(doc: {
    status: DocumentStatus;
    dueDate?: string;
    referenceDate?: Date;
    grandTotal?: number;
    amountPaid?: number;
    refundedAmount?: number;
    balanceDue?: number;
    summary?: {
        grandTotal: number;
        amountPaid: number;
        refundedAmount?: number;
        balanceDue: number;
    };
}, referenceDateArg?: Date): DocumentStatus;
export declare function formatInvoiceStatusLabel(status: DocumentStatus): string;
/**
 * Validates UPI ID / VPA format (e.g. merchant@hdfcbank)
 */
export declare function validateUpiId(upiId?: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validates structured Bank Account details including account number confirmation and IFSC/routing code.
 */
export declare function validateBankAccount(account: Partial<BankAccountDetails>): {
    valid: boolean;
    errors: Record<string, string>;
};
/**
 * Generates a real, scannable ISO/IEC 18004 SVG QR Code Data URL ONLY when payment details are verified.
 * Never generates a QR code from incomplete or unverified payment information.
 */
export declare function generateVerifiedUpiQrSvgDataUrl(params: {
    upiId?: string;
    payeeName?: string;
    amount?: number;
    currency?: string;
    invoiceNumber?: string;
}): string | null;
