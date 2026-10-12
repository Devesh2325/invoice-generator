import { z } from 'zod';

export const AddressSchema = z.object({
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const PartySchema = z.object({
  id: z.string().optional(),
  type: z.enum(['customer', 'vendor']).default('customer'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  billingAddress: AddressSchema.optional(),
  shippingAddress: AddressSchema.optional(),
  notes: z.string().optional(),
  isArchived: z.boolean().optional().default(false),
});

export const DocumentLineItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  description: z.string().min(1, 'Item description is required'),
  hsnCode: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0.0001, 'Quantity must be greater than zero'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional().default(false),
});

export const DocumentTypeEnum = z.enum([
  'invoice',
  'estimate',
  'purchase_order',
  'receipt',
  'credit_note',
  'debit_note',
  'pro_forma',
]);

export const DocumentStatusEnum = z.enum([
  'draft',
  'pending',
  'finalized',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'refunded',
  'archived',
]);

export const PaymentMethodEnum = z.enum([
  'cash',
  'bank_transfer',
  'upi',
  'cheque',
  'card',
  'other',
]);

export const BankAccountSchema = z.object({
  id: z.string(),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(6, 'Valid account number is required'),
  confirmAccountNumber: z.string().optional(),
  ifscOrRoutingCode: z.string().min(4, 'IFSC / Routing code is required'),
  branchName: z.string().optional(),
  accountType: z.enum(['current', 'savings', 'checking', 'business', 'other']).default('current'),
  swiftBicCode: z.string().optional(),
  country: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const PaymentSchema = z.object({
  id: z.string().optional(),
  documentId: z.string(),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: PaymentMethodEnum,
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const RefundSchema = z.object({
  id: z.string().optional(),
  documentId: z.string(),
  amount: z.number().positive('Refund amount must be greater than zero'),
  refundDate: z.string().min(1, 'Refund date is required'),
  refundMethod: PaymentMethodEnum,
  reason: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const DocumentFormSchema = z.object({
  invoiceName: z.string().optional(),
  type: DocumentTypeEnum.default('invoice'),
  documentNumber: z.string().min(1, 'Invoice number is required'),
  referenceNumber: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional(),
  currency: z.string().min(1).default('INR'),

  sender: z.object({
    name: z.string().min(1, 'Sender business name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    taxId: z.string().optional(),
    logoUrl: z.string().optional(),
    address: AddressSchema.optional(),
  }),

  client: PartySchema,

  items: z.array(DocumentLineItemSchema).min(1, 'At least one line item is required'),

  documentDiscountType: z.enum(['percentage', 'fixed']).optional(),
  documentDiscountValue: z.number().min(0).optional(),
  shippingFee: z.number().min(0).optional(),
  extraCharges: z.number().min(0).optional(),
  enableRoundOff: z.boolean().optional(),
  roundingMode: z.enum(['nearest_integer', 'half_up', 'half_even', 'up', 'down']).optional(),
  decimalPrecision: z.number().int().min(0).max(4).optional(),

  templateId: z.string().min(1).default('cleartax_gst'),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

export type DocumentFormData = z.infer<typeof DocumentFormSchema>;
