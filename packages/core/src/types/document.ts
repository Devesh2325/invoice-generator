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
  ownerUserId?: string;
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

  // Discount & Charges
  documentDiscountType?: DiscountType;
  documentDiscountValue?: number;
  shippingFee?: number;
  extraCharges?: number;

  // Calculation output
  summary: DocumentCalculatedSummary;

  // Extra config & Custom Theme
  templateId: string;
  customTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: 'sans' | 'serif' | 'mono';
  };
  notes?: string;
  paymentTerms?: string;
  paymentInstructions?: string;
  signatoryName?: string;

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
