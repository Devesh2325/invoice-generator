import { renderQrSvgDataUrl } from '../calculations/qr-encoder';

export class TenantAccessDeniedError extends Error {
  status: number;
  constructor(message = 'Access Denied (403): You do not have permission to view or access data belonging to another workspace.') {
    super(message);
    this.name = 'TenantAccessDeniedError';
    this.status = 403;
  }
}

export class PlanLimitReachedError extends Error {
  status: number;
  limit: number;
  current: number;
  constructor(message = 'Free trial limit reached: 7/7 invoices created. Upgrade to Pro for unlimited invoices.', limit = 7, current = 7) {
    super(message);
    this.name = 'PlanLimitReachedError';
    this.status = 402;
    this.limit = limit;
    this.current = current;
  }
}

export type DocumentType =
  | 'invoice'
  | 'estimate'
  | 'purchase_order'
  | 'receipt'
  | 'credit_note'
  | 'debit_note'
  | 'pro_forma';

export type DocumentStatus =
  | 'draft'
  | 'pending'
  | 'finalized'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'archived';

export type DiscountType = 'percentage' | 'fixed';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'upi'
  | 'cheque'
  | 'card'
  | 'other';

export type RoundingMode =
  | 'nearest_integer'
  | 'half_up'
  | 'half_even'
  | 'up'
  | 'down';

export type BankAccountType =
  | 'current'
  | 'savings'
  | 'checking'
  | 'business'
  | 'other';

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

export const INDIAN_STATES: IndianStateInfo[] = [
  { code: '27', name: 'Maharashtra', label: '27 - Maharashtra' },
  { code: '29', name: 'Karnataka', label: '29 - Karnataka' },
  { code: '07', name: 'Delhi', label: '07 - Delhi' },
  { code: '33', name: 'Tamil Nadu', label: '33 - Tamil Nadu' },
  { code: '24', name: 'Gujarat', label: '24 - Gujarat' },
  { code: '36', name: 'Telangana', label: '36 - Telangana' },
  { code: '09', name: 'Uttar Pradesh', label: '09 - Uttar Pradesh' },
  { code: '19', name: 'West Bengal', label: '19 - West Bengal' },
  { code: '06', name: 'Haryana', label: '06 - Haryana' },
  { code: '08', name: 'Rajasthan', label: '08 - Rajasthan' },
  { code: '32', name: 'Kerala', label: '32 - Kerala' },
  { code: '23', name: 'Madhya Pradesh', label: '23 - Madhya Pradesh' },
  { code: '03', name: 'Punjab', label: '03 - Punjab' },
  { code: '37', name: 'Andhra Pradesh', label: '37 - Andhra Pradesh' },
  { code: '10', name: 'Bihar', label: '10 - Bihar' },
  { code: '21', name: 'Odisha', label: '21 - Odisha' },
  { code: '18', name: 'Assam', label: '18 - Assam' },
  { code: '22', name: 'Chhattisgarh', label: '22 - Chhattisgarh' },
  { code: '20', name: 'Jharkhand', label: '20 - Jharkhand' },
  { code: '05', name: 'Uttarakhand', label: '05 - Uttarakhand' },
  { code: '02', name: 'Himachal Pradesh', label: '02 - Himachal Pradesh' },
  { code: '30', name: 'Goa', label: '30 - Goa' },
  { code: '04', name: 'Chandigarh', label: '04 - Chandigarh' },
  { code: '01', name: 'Jammu & Kashmir', label: '01 - Jammu & Kashmir' },
  { code: '34', name: 'Puducherry', label: '34 - Puducherry' },
];

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

  // Parties
  sender: {
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    logoUrl?: string;
    address?: Address;
  };
  client: Party;

  // Items
  items: CalculatedLineItem[];

  // Discount, Charges & Rounding
  documentDiscountType?: DiscountType;
  documentDiscountValue?: number;
  shippingFee?: number;
  extraCharges?: number;
  enableRoundOff?: boolean;
  roundingMode?: RoundingMode;
  decimalPrecision?: number;

  // Calculation output
  summary: DocumentCalculatedSummary;

  // Extra config, Payment Configuration & Custom Theme
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

  // History & Lifecycle
  payments: PaymentRecord[];
  refunds?: RefundRecord[];
  auditHistory?: AuditHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

// Lifecycle State Machine
const VALID_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ['pending', 'finalized', 'cancelled'],
  pending: ['sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'archived'],
  finalized: ['pending', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'archived'],
  sent: ['partially_paid', 'paid', 'overdue', 'cancelled', 'archived'],
  partially_paid: ['paid', 'overdue', 'refunded', 'cancelled', 'archived'],
  paid: ['refunded', 'archived'],
  overdue: ['partially_paid', 'paid', 'cancelled', 'archived'],
  refunded: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

export function isValidStatusTransition(
  from: DocumentStatus,
  to: DocumentStatus
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export type CanonicalDocument = DocumentModel;

/**
 * Computes the accurate, consistent invoice status based on due date, payments, and refunds.
 * Partial refunds never mark an invoice as fully refunded.
 */
export function computeEffectiveInvoiceStatus(
  doc: {
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
  },
  referenceDateArg?: Date
): DocumentStatus {
  const referenceDate = referenceDateArg || doc.referenceDate || new Date();
  if (doc.status === 'cancelled' || doc.status === 'archived') {
    return doc.status;
  }
  if (doc.status === 'draft') {
    return 'draft';
  }

  const grandTotal = Number(doc.summary?.grandTotal ?? doc.grandTotal ?? 0);
  const paid = Number(doc.summary?.amountPaid ?? doc.amountPaid ?? 0);
  const refunded = Number(doc.summary?.refundedAmount ?? doc.refundedAmount ?? 0);
  const balance = Number(
    doc.summary?.balanceDue ?? doc.balanceDue ?? Math.max(0, grandTotal - paid)
  );

  // Only mark as 'refunded' when collected payment > 0 and 100% of collected payment was refunded
  if (paid > 0 && refunded >= paid) {
    return 'refunded';
  }

  // Fully paid (with remaining net payment covering grand total)
  if (grandTotal > 0 && balance <= 0 && paid > 0) {
    return 'paid';
  }

  // Check overdue from dueDate & outstanding balance
  if (balance > 0 && doc.dueDate) {
    const due = new Date(`${doc.dueDate}T23:59:59`);
    if (!isNaN(due.getTime()) && due.getTime() < referenceDate.getTime()) {
      return 'overdue';
    }
  }

  // Partially paid (when not overdue, and some payment was collected with remaining balance)
  if (paid > 0 && balance > 0) {
    return 'partially_paid';
  }

  if (doc.status === 'finalized' || doc.status === 'sent' || doc.status === 'pending') {
    return 'pending';
  }

  return doc.status;
}

export function formatInvoiceStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending':
    case 'finalized':
    case 'sent':
      return 'Pending';
    case 'partially_paid':
      return 'Partially Paid';
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    case 'archived':
      return 'Archived';
    default:
      return String(status);
  }
}

/**
 * Validates UPI ID / VPA format (e.g. merchant@hdfcbank)
 */
export function validateUpiId(upiId?: string): { valid: boolean; error?: string } {
  const trimmed = (upiId || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'UPI ID is required to generate a verified UPI QR code.' };
  }
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid UPI ID format. Expected format: username@bankname (e.g. business@hdfcbank).',
    };
  }
  return { valid: true };
}

/**
 * Validates structured Bank Account details including account number confirmation and IFSC/routing code.
 */
export function validateBankAccount(account: Partial<BankAccountDetails>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!account.accountHolderName?.trim()) {
    errors.accountHolderName = 'Account holder name is required';
  }
  if (!account.bankName?.trim()) {
    errors.bankName = 'Bank name is required';
  }
  const accNum = (account.accountNumber || '').trim();
  if (!accNum) {
    errors.accountNumber = 'Account number is required';
  } else if (!/^[a-zA-Z0-9\-]{6,34}$/.test(accNum)) {
    errors.accountNumber = 'Account number must be 6–34 alphanumeric characters';
  }
  if (
    account.confirmAccountNumber !== undefined &&
    account.confirmAccountNumber.trim() !== '' &&
    account.confirmAccountNumber.trim() !== accNum
  ) {
    errors.confirmAccountNumber = 'Account numbers do not match';
  }
  const routing = (account.ifscOrRoutingCode || '').trim().toUpperCase();
  if (!routing) {
    errors.ifscOrRoutingCode = 'IFSC / Routing code is required';
  } else if (
    (account.country || 'India').toLowerCase() === 'india' &&
    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(routing) &&
    routing.length < 6
  ) {
    errors.ifscOrRoutingCode = 'Enter a valid 11-character IFSC code (e.g. HDFC0000124) or routing code';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generates a real, scannable ISO/IEC 18004 SVG QR Code Data URL ONLY when payment details are verified.
 * Never generates a QR code from incomplete or unverified payment information.
 */
export function generateVerifiedUpiQrSvgDataUrl(params: {
  upiId?: string;
  payeeName?: string;
  amount?: number;
  currency?: string;
  invoiceNumber?: string;
}): string | null {
  const validation = validateUpiId(params.upiId);
  if (!validation.valid) {
    return null;
  }
  const upiId = params.upiId!.trim();
  const payeeName = (params.payeeName || '').trim();
  if (!payeeName) {
    return null;
  }

  // NPCI UPI Linking Specification: keep '@' literal in pa=VPA so all UPI apps parse VPA directly
  const queryParts = [
    `pa=${upiId}`,
    `pn=${encodeURIComponent(payeeName)}`,
  ];
  if (params.amount && params.amount > 0) {
    queryParts.push(`am=${Number(params.amount).toFixed(2)}`);
  }
  queryParts.push(`cu=${encodeURIComponent(params.currency || 'INR')}`);
  if (params.invoiceNumber) {
    queryParts.push(`tn=${encodeURIComponent(params.invoiceNumber)}`);
  }

  const payload = `upi://pay?${queryParts.join('&')}`;
  return renderQrSvgDataUrl(payload);
}

