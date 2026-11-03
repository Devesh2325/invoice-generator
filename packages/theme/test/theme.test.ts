import { describe, it, expect } from 'vitest';
import { describe, it, expect } from 'vitest';
import { isTemplateAllowedForPlan, getCurrencyTaxProfile, CURRENCIES } from '@invoice/core';
import { getInvoiceTemplate, getTemplate, getTemplatesByCategory, INVOICE_TEMPLATES, TEMPLATES } from '../src/index';

describe('Document Theme & Templates', () => {
  it('offers each design once, in one of four categories', () => {
    const grouped = getTemplatesByCategory();
    expect(grouped.map((g) => g.label)).toEqual(['India GST', 'Country tax invoices', 'Any business', 'Special documents']);
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
