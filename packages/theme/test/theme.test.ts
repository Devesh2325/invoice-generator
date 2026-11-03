import { describe, it, expect } from 'vitest';
import { describe, it, expect } from 'vitest';
import { isTemplateAllowedForPlan, getCurrencyTaxProfile, CURRENCIES, TEMPLATE_CURRENCIES, templateForCurrency } from '@invoice/core';
import { getInvoiceTemplate, getTemplate, getTemplatesByCategory, INVOICE_TEMPLATES, mapCanonicalDocumentToTemplateInv, TEMPLATES } from '../src/index';

describe('Document Theme & Templates', () => {
  it('offers each design once, in one of three categories', () => {
    const grouped = getTemplatesByCategory();
    expect(grouped.map((g) => g.label)).toEqual(['Any business', 'Country tax invoices', 'Special documents']);
    expect(grouped.every((g) => g.templates.length > 0)).toBe(true);

    const presets = Object.keys(TEMPLATES).map((id) => getInvoiceTemplate(id).id);
    expect(new Set(presets).size).toBe(presets.length);
    expect(presets).toEqual(Object.keys(TEMPLATES));
  });

  it('gives every currency a default template that exists and free users can save', () => {
    for (const code of Object.keys(CURRENCIES)) {
      const id = getCurrencyTaxProfile(code).defaultTemplateId;
      expect(TEMPLATES[id], code).toBeDefined();
      expect(isTemplateAllowedForPlan('starter', id), code).toBe(true);
    }
  });

  it('does not put reverse charge wording on an ordinary EUR invoice', () => {
    const id = getCurrencyTaxProfile('EUR').defaultTemplateId;
    expect(getInvoiceTemplate(id).note).toBe('');
  });

  it.each([
    ['cleartax_gst', 'in-gst'],
    ['tally_prime', 'in-gst'],
    ['stripe_clean', 'dark-tech'],
    ['canva_studio', 'creative'],
    ['classic', 'eu-vat'],
    ['apple_clean', 'hk-no-tax'],
    ['retail', 'ch-sidebar'],
  ])('keeps rendering saved invoices that use the old ID %s', (oldId, current) => {
    expect(getInvoiceTemplate(oldId).id).toBe(current);
    expect(getTemplate(oldId).id).toBe(current);
  });

  it.each(['za-vat', 'nz-gst', 'mx-iva'])('keeps the retired design %s for saved invoices, but stops offering it', (id) => {
    expect(INVOICE_TEMPLATES.some((t) => t.id === id)).toBe(true);
    expect(TEMPLATES[id]).toBeUndefined();
  });

  it('prints the selected bank account, not just the first one', () => {
    const accounts = [
      { id: 'a', bankName: 'First Bank', accountNumber: '111', ifscOrRoutingCode: 'AAA' },
      { id: 'b', bankName: 'Second Bank', accountNumber: '222', ifscOrRoutingCode: 'BBB' },
    ];
    const display = { showBankDetails: true, showUpiId: false, showQrCode: false, showPaymentInstructions: true, showPaymentTerms: true };
    const doc = (selected: string[]) =>
      ({
        documentNumber: 'T-1',
        currency: 'INR',
        type: 'invoice',
        items: [],
        sender: { name: 'A' },
        client: { name: 'B' },
        paymentConfig: { bankAccounts: accounts, selectedBankAccountIds: selected, display },
      }) as any;
    expect(mapCanonicalDocumentToTemplateInv(doc(['b'])).payment.bankName).toBe('Second Bank');
    expect(mapCanonicalDocumentToTemplateInv(doc([])).payment.bankName).toBe('First Bank');
  });

  it('keeps paid templates paid under their old IDs', () => {
    expect(isTemplateAllowedForPlan('starter', 'stripe_clean')).toBe(false);
    expect(isTemplateAllowedForPlan('starter', 'cleartax_gst')).toBe(true);
  });

  it('provides sensible fallback for unknown template ID', () => {
    const tmpl = getTemplate('non_existent_id');
    expect(tmpl.id).toBe('modern');
    expect(tmpl.defaultTokens.primaryColor).toBe('#2563EB');
  });
});

describe('country templates', () => {
  it('links every country template to a currency whose usual design works with it', () => {
    const countryTemplates = Object.values(TEMPLATES).filter((template) => template.category === 'international');
    expect(countryTemplates.length).toBeGreaterThan(0);
    for (const template of countryTemplates) {
      const currency = TEMPLATE_CURRENCIES[template.id];
      expect(currency, template.id).toBeTruthy();
      expect(templateForCurrency(template.id, currency), template.id).toBe(template.id);
      expect(TEMPLATE_CURRENCIES[getCurrencyTaxProfile(currency).defaultTemplateId], template.id).toBe(currency);
    }
  });

  it('swaps a country template when the currency changes, but not an any-currency design', () => {
    expect(templateForCurrency('sg-gst', 'INR')).toBe('in-gst');
    expect(templateForCurrency('in-gst', 'SGD')).toBe('sg-gst');
    expect(templateForCurrency('creative', 'SGD')).toBe('creative');
    expect(templateForCurrency('credit-note', 'JPY')).toBe('credit-note');
  });
});
