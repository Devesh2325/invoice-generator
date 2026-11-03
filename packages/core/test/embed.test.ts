import { describe, it, expect } from 'vitest';
import { EmbedPrefillSchema, buildDocumentFromPrefill } from '../src/embed';
import { isTemplateAllowedForPlan } from '../src/config/app-config';

describe('Embed prefill', () => {
  it('accepts an empty prefill, leaving defaults to the editor', () => {
    const doc = buildDocumentFromPrefill(EmbedPrefillSchema.parse({}));
    expect(doc.type).toBe('invoice');
    expect(doc.items).toBeUndefined();
    expect(doc.documentNumber).toBeUndefined();
  });

  it('maps parties and items and applies the currency tax rate', () => {
    const doc = buildDocumentFromPrefill(
      EmbedPrefillSchema.parse({
        currency: 'gbp',
        client: { name: 'Globex', address: { city: 'Leeds' } },
        items: [{ description: 'Design', quantity: 2, unitPrice: 500 }],
      })
    );
    expect(doc.currency).toBe('GBP');
    expect(doc.client.name).toBe('Globex');
    expect(doc.client.billingAddress?.city).toBe('Leeds');
    expect(doc.items[0].taxRate).toBe(20);
    expect(doc.items[0].id).toBe('item_1');
  });

  it('ignores totals sent by the host', () => {
    const parsed = EmbedPrefillSchema.parse({ summary: { grandTotal: 1 } });
    expect(buildDocumentFromPrefill(parsed).summary).toBeUndefined();
  });

  it('only accepts templates that are free', () => {
    expect(buildDocumentFromPrefill({ template: 'creative' }).templateId).toBe('creative');
    expect(buildDocumentFromPrefill({ template: 'dark-tech' }).templateId).toBeUndefined();
  });

  it.each([
    ['script logo URL', { logoUrl: 'javascript:alert(1)' }],
    ['SVG logo', { logoUrl: 'data:image/svg+xml;base64,AAAA' }],
    ['negative price', { items: [{ description: 'x', unitPrice: -1 }] }],
    ['badly formed date', { issueDate: '02/11/2026' }],
    ['badly formed colour', { accentColor: 'red;background:url(x)' }],
  ])('rejects a %s', (_label, input) => {
    expect(EmbedPrefillSchema.safeParse(input).success).toBe(false);
  });
});

describe('Studio Creative Bold', () => {
  it('is free for visitors and the starter plan', () => {
    expect(isTemplateAllowedForPlan('anonymous', 'creative')).toBe(true);
    expect(isTemplateAllowedForPlan('starter', 'creative')).toBe(true);
  });
});
