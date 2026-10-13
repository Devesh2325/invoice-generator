import { describe, it, expect } from 'vitest';
import { CURRENCIES, formatCurrency } from '@invoice/core';
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_TYPE_SECTIONS,
} from '../src/components/document/document-type-selector';
import {
  renderInvoiceDocument,
  renderInvoice,
  INVOICE_TEMPLATES,
  getInvoiceTemplate,
} from '@invoice/theme';

describe('Web Configuration & Helpers', () => {
  it('formats currency correctly for web preview displays', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatCurrency(5000, 'EUR')).toBe('5,000.00 €');
    expect(formatCurrency(9999, 'JPY')).toBe('¥9,999');
  });

  it('contains supported currency records', () => {
    expect(CURRENCIES.USD).toBeDefined();
    expect(CURRENCIES.GBP).toBeDefined();
    expect(CURRENCIES.CAD).toBeDefined();
  });
});

describe('Document Type Selector Two-Section Structure', () => {
  it('provides two clearly separated sections: Invoicing & Sales and Payments & Adjustments', () => {
    expect(DOCUMENT_TYPE_SECTIONS.length).toBe(2);
    expect(DOCUMENT_TYPE_SECTIONS[0].id).toBe('sales');
    expect(DOCUMENT_TYPE_SECTIONS[0].title).toBe('Invoicing & Sales');
    expect(DOCUMENT_TYPE_SECTIONS[1].id).toBe('adjustments');
    expect(DOCUMENT_TYPE_SECTIONS[1].title).toBe('Payments & Adjustments');
  });

  it('contains 4 Invoicing & Sales document types', () => {
    const salesOptions = DOCUMENT_TYPE_OPTIONS.filter((opt) => opt.section === 'sales');
    expect(salesOptions.length).toBe(4);
    expect(salesOptions.map((o) => o.value)).toEqual([
      'invoice',
      'estimate',
      'pro_forma',
      'purchase_order',
    ]);
  });

  it('contains 3 Payments & Adjustments document types', () => {
    const adjOptions = DOCUMENT_TYPE_OPTIONS.filter((opt) => opt.section === 'adjustments');
    expect(adjOptions.length).toBe(3);
    expect(adjOptions.map((o) => o.value)).toEqual([
      'receipt',
      'credit_note',
      'debit_note',
    ]);
  });
});

describe('18 Print-Ready Template Engine', () => {
  it('registers all 18 standard templates', () => {
    expect(INVOICE_TEMPLATES.length).toBe(18);
    const ids = INVOICE_TEMPLATES.map((t) => t.id);
    expect(ids).toContain('in-gst');
    expect(ids).toContain('uk-vat');
    expect(ids).toContain('eu-reverse-charge');
    expect(ids).toContain('us-sales-tax');
    expect(ids).toContain('au-gst');
    expect(ids).toContain('sg-gst');
    expect(ids).toContain('ae-vat');
    expect(ids).toContain('ca-hst');
    expect(ids).toContain('za-vat');
    expect(ids).toContain('jp-qualified');
    expect(ids).toContain('dark-tech');
    expect(ids).toContain('proforma');
    expect(ids).toContain('credit-note');
    expect(ids).toContain('quotation');
    expect(ids).toContain('ch-sidebar');
    expect(ids).toContain('nz-gst');
    expect(ids).toContain('mx-iva');
    expect(ids).toContain('hk-no-tax');
  });

  it('renders complete print-ready HTML documents for all 18 templates', () => {
    const sampleInv = {
      number: 'INV-TEST-001',
      issueDate: '2026-10-13',
      dueDate: '2026-10-28',
      currency: '₹',
      seller: { name: 'Acme Test Corp' },
      buyer: { name: 'Client Test Ltd' },
      items: [
        { description: 'Consulting Services', qty: 2, rate: 500, taxRate: 18 },
      ],
    };

    INVOICE_TEMPLATES.forEach((tpl) => {
      const docHtml = renderInvoiceDocument(sampleInv, tpl.id, { preview: true });
      expect(docHtml).toContain('<!doctype html>');
      expect(docHtml).toContain('INV-TEST-001');

      const inner = renderInvoice(sampleInv, tpl.id);
      expect(inner).toContain('inv');
    });
  });
});
