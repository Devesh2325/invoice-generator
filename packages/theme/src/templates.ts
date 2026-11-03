import { DocumentType, resolveTemplateId } from '@invoice/core';

export type TemplateCategory = 'international' | 'style' | 'documents';

export interface DocumentTemplateMeta {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  categoryLabel: string;
  defaultTokens: {
    primaryColor: string;
    fontFamily: 'sans' | 'serif' | 'mono';
  };
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'style', label: 'Any business' },
  { id: 'international', label: 'Country tax invoices' },
  { id: 'documents', label: 'Special documents' },
];

const entry = (
  id: string,
  name: string,
  category: TemplateCategory,
  primaryColor: string,
  description: string,
  fontFamily: 'sans' | 'serif' | 'mono' = 'sans'
): DocumentTemplateMeta => ({
  id,
  name,
  description,
  category,
  categoryLabel: TEMPLATE_CATEGORIES.find((c) => c.id === category)!.label,
  defaultTokens: { primaryColor, fontFamily },
});

/**
 * The templates people can choose. Each one is a different design in INVOICE_TEMPLATES.
 * Older IDs are mapped in LEGACY_TEMPLATE_IDS, and retired designs stay in INVOICE_TEMPLATES,
 * so saved invoices keep rendering. To add a template, add it to both lists.
 */
export const TEMPLATES: Record<string, DocumentTemplateMeta> = Object.fromEntries(
  [
    entry('modern', 'Modern Clean', 'style', '#2563EB', 'A clean, simple layout that works in any currency.'),
    entry('creative', 'Studio Creative Bold', 'style', '#9333EA', 'A bold colour band and strong type for studios and agencies.'),
    entry('dark-tech', 'Dark Mode Tech', 'style', '#C6F432', 'Dark paper with a lime accent and monospaced numbers.', 'mono'),
    entry('hk-no-tax', 'No Sales Tax', 'style', '#581C87', 'A centred, formal layout for businesses that don’t charge sales tax.', 'serif'),

    entry('au-gst', 'Australia GST', 'international', '#166534', 'Australian tax invoice with ABN, BSB and GST.'),
    entry('ca-hst', 'Canada GST/HST', 'international', '#4338CA', 'Canadian invoice with GST/HST and Business Number.'),
    entry('eu-vat', 'EU VAT', 'international', '#334155', 'Standard EU VAT invoice with VAT ID and IBAN.', 'serif'),
    entry('eu-reverse-charge', 'EU VAT (reverse charge)', 'international', '#334155', 'For B2B sales between EU countries, where the customer accounts for the VAT.', 'serif'),
    entry('in-gst', 'India GST', 'international', '#1D4ED8', 'GST tax invoice with HSN/SAC codes, place of supply and the CGST, SGST or IGST split.'),
    entry('jp-qualified', 'Japan Qualified Invoice', 'international', '#C1121F', 'Qualified invoice with registration number and consumption tax.'),
    entry('sg-gst', 'Singapore GST', 'international', '#BE123C', 'Singapore tax invoice with GST registration number and UEN.'),
    entry('ch-sidebar', 'Switzerland VAT', 'international', '#1F2937', 'Swiss VAT invoice with a sidebar layout, UID and IBAN.'),
    entry('ae-vat', 'UAE VAT', 'international', '#0B3D4A', 'English and Arabic tax invoice with TRN and IBAN.'),
    entry('uk-vat', 'UK VAT', 'international', '#1D3557', 'UK VAT invoice with VAT registration number, sort code and tax point.'),
    entry('us-sales-tax', 'US Sales Tax', 'international', '#0F766E', 'US invoice with sales tax, EIN and ABA routing number.'),

    entry('proforma', 'Proforma Invoice', 'documents', '#B45309', 'Marked “Not a tax invoice”, for payment before delivery.'),
    entry('credit-note', 'Credit Note', 'documents', '#7F1D1D', 'Shows amounts as credits against an invoice you already issued.'),
    entry('quotation', 'Quotation / Estimate', 'documents', '#1E40AF', 'A price quote with a valid-until date and acceptance terms.'),
  ].map((template) => [template.id, template])
);

/** Templates made for one document type. Choosing one sets the type, so the two can't contradict each other. */
export const TEMPLATE_DOCUMENT_TYPES: Record<string, DocumentType> = {
  proforma: 'pro_forma',
  'credit-note': 'credit_note',
  quotation: 'estimate',
};

export function getTemplate(id?: string): DocumentTemplateMeta {
  return TEMPLATES[resolveTemplateId(id || 'modern')] || TEMPLATES.modern;
}

export function getTemplatesByCategory(): {
  category: TemplateCategory;
  label: string;
  templates: DocumentTemplateMeta[];
}[] {
  return TEMPLATE_CATEGORIES.map((cat) => ({
    category: cat.id,
    label: cat.label,
    templates: Object.values(TEMPLATES).filter((t) => t.category === cat.id),
  }));
}
