import { z } from 'zod';
import { isTemplateAllowedForPlan } from '../config/app-config';
import { getCurrencyConfig, getCurrencyTaxProfile } from '../types/currency';
import type { DocumentModel, DocumentType } from '../types/document';

/** Messages exchanged between the /embed page and the site hosting it. */
export const EMBED_MESSAGES = {
  /** Embed to host, sent once the editor can receive messages. Carries no invoice data. */
  ready: 'invoxa:ready',
  /** Host to embed. Names the host's origin and optionally prefills the invoice. */
  init: 'invoxa:init',
  /** Embed to host, after every edit. */
  change: 'invoxa:change',
  /** Embed to host, when the user clicks Save. */
  save: 'invoxa:save',
  /** Embed to host, when a prefill was rejected. */
  error: 'invoxa:error',
} as const;

const text = (max = 300) => z.string().trim().max(max);
const amount = z.number().finite().min(0).max(1e12);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format');

const EmbedAddressSchema = z
  .object({
    street: text(),
    city: text(100),
    state: text(100),
    postalCode: text(20),
    country: text(100),
  })
  .partial();

const EmbedPartySchema = z
  .object({
    name: text(200),
    email: text(200),
    phone: text(50),
    taxId: text(50),
    address: EmbedAddressSchema,
  })
  .partial();

const EmbedItemSchema = z.object({
  description: text(500).default(''),
  hsnCode: text(20).optional(),
  unit: text(20).optional(),
  quantity: amount.default(1),
  unitPrice: amount.default(0),
  taxRate: z.number().finite().min(0).max(100).optional(),
});

export const EmbedPrefillSchema = z
  .object({
    type: z.enum(['invoice', 'estimate', 'purchase_order', 'pro_forma', 'receipt', 'credit_note', 'debit_note']),
    number: text(60),
    reference: text(100),
    issueDate: isoDate,
    dueDate: isoDate,
    currency: z.string().trim().toUpperCase().length(3),
    template: text(60),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a colour such as #9333EA'),
    logoUrl: z
      .string()
      .max(3_000_000)
      .regex(/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/, 'Use an https URL or a PNG, JPEG or WebP data URL'),
    sender: EmbedPartySchema,
    client: EmbedPartySchema,
    items: z.array(EmbedItemSchema).min(1).max(500),
    shippingFee: amount,
    notes: text(4000),
    paymentTerms: text(200),
  })
  .partial();

export type EmbedPrefill = z.infer<typeof EmbedPrefillSchema>;

/**
 * Turns a validated prefill into the starting document for the editor. Fields left out use the
 * editor's normal defaults. Totals are not accepted from the host: the engine always works them out.
 */
export function buildDocumentFromPrefill(prefill: EmbedPrefill): DocumentModel {
  const currency = prefill.currency && getCurrencyConfig(prefill.currency).code;
  const profile = getCurrencyTaxProfile(currency);
  const defaultState = profile.isIndiaGst ? '27 - Maharashtra' : profile.defaultState;
  const address = (party: EmbedPrefill['sender']) => ({
    street1: party?.address?.street || '',
    city: party?.address?.city || '',
    state: party?.address?.state || defaultState,
    postalCode: party?.address?.postalCode || '',
    country: party?.address?.country || profile.defaultCountry,
  });
  const fields = (party: EmbedPrefill['sender']) => ({
    name: party?.name || '',
    email: party?.email || '',
    phone: party?.phone || '',
    taxId: party?.taxId || '',
  });

  const document = {
    type: (prefill.type || 'invoice') as DocumentType,
    status: 'draft',
    documentNumber: prefill.number,
    referenceNumber: prefill.reference,
    issueDate: prefill.issueDate,
    dueDate: prefill.dueDate,
    currency,
    // A host can't unlock paid templates by naming one.
    templateId: prefill.template && isTemplateAllowedForPlan('starter', prefill.template) ? prefill.template : undefined,
    customTheme: prefill.accentColor ? { primaryColor: prefill.accentColor } : undefined,
    sender: { ...fields(prefill.sender), logoUrl: prefill.logoUrl, address: address(prefill.sender) },
    client: { id: '', type: 'customer', ...fields(prefill.client), billingAddress: address(prefill.client) },
    items: prefill.items?.map((item, index) => ({
      id: `item_${index + 1}`,
      description: item.description,
      hsnCode: item.hsnCode || '',
      unit: item.unit || 'PCS',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? profile.defaultTaxRate,
      taxInclusive: false,
      discountType: 'percentage',
      discountValue: 0,
    })),
    shippingFee: prefill.shippingFee,
    notes: prefill.notes,
    paymentTerms: prefill.paymentTerms,
  };
  return document as unknown as DocumentModel;
}
