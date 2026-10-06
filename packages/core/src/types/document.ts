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
  | 'finalized'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'archived';

export type DiscountType = 'percentage' | 'fixed';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'cheque'
  | 'card'
  | 'other';

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

export interface DocumentLineItemInput {
  id?: string;
  productId?: string;
  description: string;
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
  lineTotal: number;
}

export interface TaxBreakdownItem {
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface DocumentCalculatedSummary {
  subtotal: number;
  discountTotal: number;
  taxableSubtotal: number;
  totalTax: number;
  taxBreakdown: TaxBreakdownItem[];
  shippingFee: number;
  extraCharges: number;
  grandTotal: number;
  amountPaid: number;
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

export interface DocumentModel {
  id: string;
  tenantId?: string;
  type: DocumentType;
  status: DocumentStatus;
  documentNumber: string;
  referenceNumber?: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  exchangeRate?: number;

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

  // Discount & Charges
  documentDiscountType?: DiscountType;
  documentDiscountValue?: number;
  shippingFee?: number;
  extraCharges?: number;

  // Calculation output
  summary: DocumentCalculatedSummary;

  // Extra config
  templateId: string;
  notes?: string;
  paymentTerms?: string;
  paymentInstructions?: string;

  // History & Lifecycle
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

// Lifecycle State Machine
const VALID_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ['finalized', 'cancelled'],
  finalized: ['sent', 'partially_paid', 'paid', 'cancelled', 'archived'],
  sent: ['partially_paid', 'paid', 'overdue', 'cancelled', 'archived'],
  partially_paid: ['paid', 'overdue', 'archived'],
  paid: ['archived'],
  overdue: ['partially_paid', 'paid', 'cancelled', 'archived'],
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
