import { describe, it, expect, vi } from 'vitest';
import { CURRENCIES, DocumentModel, calculateDocument, formatCurrency } from '@invoice/core';
import { buildCsv } from '../src/lib/export/export-document';
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_TYPE_SECTIONS,
} from '../src/components/document/document-type-selector';
import {
  renderInvoiceDocument,
  renderInvoice,
  INVOICE_TEMPLATES,
  getInvoiceTemplate,
  mapCanonicalDocumentToTemplateInv,
} from '@invoice/theme';

// PDF capture needs a browser, and the CSV code under test doesn't use it.
vi.mock('@/lib/pdf/export-pdf', () => ({ captureInvoice: vi.fn() }));

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

describe('Invoice totals match the calculation engine', () => {
  const makeDoc = (senderState: string, clientState: string): any => {
    const calc = calculateDocument({
      currency: 'INR',
      senderState,
      clientState,
      items: [{ id: '1', description: 'Steel rods', quantity: 2, unitPrice: 1000, taxRate: 18 }],
      documentDiscountType: 'percentage',
      documentDiscountValue: 10,
      shippingFee: 100,
    });
    return {
      id: 'd1',
      type: 'invoice',
      status: 'pending',
      documentNumber: 'INV-1',
      issueDate: '2026-11-01',
      currency: 'INR',
      sender: { name: 'Seller', address: { state: senderState } },
      client: { id: 'c1', type: 'customer', name: 'Buyer', billingAddress: { state: clientState } },
      items: calc.items,
      summary: calc.summary,
      templateId: 'cleartax_gst',
      payments: [],
      createdAt: '',
      updatedAt: '',
    };
  };
  const render = (doc: any) => renderInvoice(mapCanonicalDocumentToTemplateInv(doc), doc.templateId);

  it('includes document discount and shipping in the invoice total', () => {
    const doc = makeDoc('27 - Maharashtra', '27 - Maharashtra');
    expect(doc.summary.grandTotal).toBe(2224);
    const html = render(doc);
    expect(html).toContain('2,224.00');
    expect(html).toContain('Shipping');
    expect(html).toContain('Discount');
  });

  it('shows CGST and SGST, and never IGST, within one state', () => {
    const html = render(makeDoc('27 - Maharashtra', '27 - Maharashtra'));
    expect(html).toContain('CGST');
    expect(html).toContain('SGST');
    expect(html).not.toContain('IGST');
  });

  it('shows IGST, and never CGST or SGST, between states', () => {
    const html = render(makeDoc('27 - Maharashtra', '29 - Karnataka'));
    expect(html).toContain('IGST');
    expect(html).not.toContain('CGST');
    expect(html).not.toContain('SGST');
  });

  it('does not invent notes, bank details or a sample QR for a real document', () => {
    const doc = makeDoc('27 - Maharashtra', '27 - Maharashtra');
    doc.paymentConfig = {
      bankAccounts: [],
      display: { showBankDetails: false, showUpiId: false, showQrCode: false, showPaymentInstructions: true, showPaymentTerms: true },
    };
    const inv = mapCanonicalDocumentToTemplateInv(doc);
    const html = renderInvoice(inv, doc.templateId, { preview: true });
    expect(html).not.toContain('Late payment');
    expect(html).not.toContain('Bank account details');
    expect(html).not.toContain('QR code placeholder');
  });
});

describe('CSV export tax lines', () => {
  const exportFor = (currency: string, senderState: string, clientState: string) => {
    const { items, summary } = calculateDocument({
      currency,
      senderState,
      clientState,
      items: [{ id: '1', description: 'Work', quantity: 1, unitPrice: 100, taxRate: 10, taxInclusive: false, discountType: 'percentage', discountValue: 0 }],
    } as Parameters<typeof calculateDocument>[0]);
    return buildCsv({
      type: 'invoice',
      documentNumber: 'INV-1',
      issueDate: '2026-01-01',
      currency,
      sender: { name: 'Seller' },
      client: { name: 'Buyer' },
      items,
      summary,
    } as unknown as DocumentModel);
  };

  it('shows the real tax, and no GST split, outside India', () => {
    const csv = exportFor('USD', 'NY', 'CA');
    expect(csv).toContain('Sales Tax,10');
    expect(csv).not.toContain('CGST');
    expect(csv).not.toContain('IGST');
  });

  it('splits GST for INR', () => {
    expect(exportFor('INR', '27 - Maharashtra', '27 - Maharashtra')).toContain('CGST,5');
    expect(exportFor('INR', '27 - Maharashtra', '29 - Karnataka')).toContain('IGST,10');
  });
});

describe('Print-Ready Template Engine', () => {
  it('registers all standard templates', () => {
    expect(INVOICE_TEMPLATES.length).toBe(21);
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
