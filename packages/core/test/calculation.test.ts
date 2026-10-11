import { describe, it, expect } from 'vitest';
import { calculateDocument } from '../src/calculations/financial-engine';
import { formatCurrency } from '../src/types/currency';
import { isValidStatusTransition } from '../src/types/document';
import { formatDocumentNumber, getNextSequenceNumber } from '../src/numbering';
import { DocumentFormSchema } from '../src/schemas';

describe('Financial Calculation Engine', () => {
  it('calculates simple line item with zero tax and zero discount', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [
        { description: 'Consulting Service', quantity: 10, unitPrice: 150 },
      ],
    });

    expect(result.summary.subtotal).toBe(1500);
    expect(result.summary.discountTotal).toBe(0);
    expect(result.summary.taxableSubtotal).toBe(1500);
    expect(result.summary.totalTax).toBe(0);
    expect(result.summary.grandTotal).toBe(1500);
    expect(result.summary.balanceDue).toBe(1500);
  });

  it('correctly handles line-level percentage and fixed discounts', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          description: 'Item A',
          quantity: 2,
          unitPrice: 100, // 200 gross
          discountType: 'percentage',
          discountValue: 10, // 10% = 20 discount -> 180 net
        },
        {
          description: 'Item B',
          quantity: 1,
          unitPrice: 50, // 50 gross
          discountType: 'fixed',
          discountValue: 15, // 15 discount -> 35 net
        },
      ],
    });

    expect(result.summary.subtotal).toBe(250);
    expect(result.summary.discountTotal).toBe(35);
    expect(result.summary.taxableSubtotal).toBe(215);
    expect(result.summary.grandTotal).toBe(215);
  });

  it('calculates tax-exclusive pricing accurately with multiple tax rates', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          description: 'Standard Goods',
          quantity: 1,
          unitPrice: 100,
          taxRate: 20, // 20% tax = $20
          taxInclusive: false,
        },
        {
          description: 'Reduced Goods',
          quantity: 1,
          unitPrice: 100,
          taxRate: 5, // 5% tax = $5
          taxInclusive: false,
        },
      ],
    });

    expect(result.summary.taxableSubtotal).toBe(200);
    expect(result.summary.totalTax).toBe(25);
    expect(result.summary.grandTotal).toBe(225);
    expect(result.summary.taxBreakdown).toHaveLength(2);

    const tax20 = result.summary.taxBreakdown.find((b) => b.rate === 20);
    const tax5 = result.summary.taxBreakdown.find((b) => b.rate === 5);
    expect(tax20?.taxAmount).toBe(20);
    expect(tax5?.taxAmount).toBe(5);
  });

  it('calculates tax-inclusive pricing accurately', () => {
    // Gross = 120, Tax 20% inclusive -> Net = 120 / 1.2 = 100, Tax = 20
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          description: 'Inclusive Service',
          quantity: 1,
          unitPrice: 120,
          taxRate: 20,
          taxInclusive: true,
        },
      ],
    });

    expect(result.items[0].lineNet).toBe(100);
    expect(result.items[0].taxAmount).toBe(20);
    expect(result.items[0].lineTotal).toBe(120);
    expect(result.summary.grandTotal).toBe(120);
    expect(result.summary.totalTax).toBe(20);
  });

  it('handles JPY currency with 0 decimal places rounding deterministically', () => {
    const result = calculateDocument({
      currency: 'JPY',
      items: [
        {
          description: 'Tokyo Tech Consulting',
          quantity: 3,
          unitPrice: 3333.333,
        },
      ],
    });

    expect(result.summary.subtotal).toBe(10000);
    expect(result.summary.grandTotal).toBe(10000);
    expect(formatCurrency(10000, 'JPY')).toBe('¥10,000');
  });

  it('handles partial payments and calculates remaining balance correctly', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Web Project', quantity: 1, unitPrice: 5000 }],
      shippingFee: 150,
      extraCharges: 50,
      amountPaid: 2000,
    });

    expect(result.summary.grandTotal).toBe(5200);
    expect(result.summary.amountPaid).toBe(2000);
    expect(result.summary.balanceDue).toBe(3200);
  });

  it('splits GST into 50/50 CGST and SGST for Intra-State supply (same Indian state)', () => {
    const result = calculateDocument({
      currency: 'INR',
      senderState: '27 - Maharashtra',
      clientState: '27 - Maharashtra',
      items: [
        {
          description: 'SaaS Platform Subscription',
          hsnCode: '998314',
          quantity: 1,
          unitPrice: 10000,
          taxRate: 18,
        },
      ],
    });

    expect(result.summary.gstSupplyType).toBe('intra');
    expect(result.summary.cgstTotal).toBe(900);
    expect(result.summary.sgstTotal).toBe(900);
    expect(result.summary.igstTotal).toBe(0);
    expect(result.summary.totalTax).toBe(1800);
    expect(result.summary.grandTotal).toBe(11800);
    expect(result.items[0].cgstRate).toBe(9);
    expect(result.items[0].sgstRate).toBe(9);
    expect(result.items[0].igstRate).toBe(0);
  });

  it('applies full IGST for Inter-State supply (different Indian states)', () => {
    const result = calculateDocument({
      currency: 'INR',
      senderState: '27 - Maharashtra',
      clientState: '29 - Karnataka',
      items: [
        {
          description: 'Enterprise Consulting',
          hsnCode: '998311',
          quantity: 1,
          unitPrice: 10000,
          taxRate: 18,
        },
      ],
    });

    expect(result.summary.gstSupplyType).toBe('inter');
    expect(result.summary.cgstTotal).toBe(0);
    expect(result.summary.sgstTotal).toBe(0);
    expect(result.summary.igstTotal).toBe(1800);
    expect(result.summary.totalTax).toBe(1800);
    expect(result.summary.grandTotal).toBe(11800);
    expect(result.items[0].igstRate).toBe(18);
    expect(result.items[0].igstAmount).toBe(1800);
  });
});

describe('Document Lifecycle State Machine', () => {
  it('allows valid transitions', () => {
    expect(isValidStatusTransition('draft', 'finalized')).toBe(true);
    expect(isValidStatusTransition('finalized', 'sent')).toBe(true);
    expect(isValidStatusTransition('sent', 'partially_paid')).toBe(true);
    expect(isValidStatusTransition('partially_paid', 'paid')).toBe(true);
    expect(isValidStatusTransition('paid', 'archived')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    // Cannot jump draft straight to paid or sent without finalization
    expect(isValidStatusTransition('draft', 'paid')).toBe(false);
    expect(isValidStatusTransition('draft', 'sent')).toBe(false);
    // Cannot move from archived back to draft
    expect(isValidStatusTransition('archived', 'draft')).toBe(false);
    // Cannot move from paid back to draft
    expect(isValidStatusTransition('paid', 'draft')).toBe(false);
  });
});

describe('Document Numbering Engine', () => {
  it('formats document numbers according to rules', () => {
    const rule = { prefix: 'INV', includeYear: true, padLength: 5, nextNumber: 42 };
    const date = new Date(2026, 0, 15);
    const num = formatDocumentNumber(rule, 42, date);
    expect(num).toBe('INV-2026-00042');
  });

  it('resolves collisions by monotonically incrementing sequence', () => {
    const rule = { prefix: 'INV', includeYear: true, padLength: 5, nextNumber: 1 };
    const date = new Date(2026, 0, 15);
    const existing = ['INV-2026-00001', 'INV-2026-00002'];

    const next = getNextSequenceNumber(existing, rule, date);
    expect(next.number).toBe('INV-2026-00003');
    expect(next.sequence).toBe(3);
  });
});

describe('Document Zod Validation Schemas', () => {
  it('validates a complete valid document form payload', () => {
    const validData = {
      type: 'invoice',
      documentNumber: 'INV-2026-00001',
      issueDate: '2026-10-07',
      currency: 'USD',
      sender: {
        name: 'Apex Solutions Inc',
        email: 'billing@apex.io',
      },
      client: {
        name: 'Globex Corp',
        email: 'accounts@globex.com',
      },
      items: [
        {
          description: 'Enterprise Cloud Architecture',
          quantity: 40,
          unitPrice: 200,
        },
      ],
      templateId: 'modern',
    };

    const parsed = DocumentFormSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('rejects documents with zero line items or invalid quantities', () => {
    const invalidData = {
      type: 'invoice',
      documentNumber: 'INV-2026-00001',
      issueDate: '2026-10-07',
      sender: { name: 'Apex' },
      client: { name: 'Client' },
      items: [], // empty items
    };

    const parsed = DocumentFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
