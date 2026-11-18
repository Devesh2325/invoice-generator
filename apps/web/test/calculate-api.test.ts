import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../src/app/api/calculate/route';

function createPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Server-Side Calculation API (/api/calculate)', () => {
  it('responds with active status on GET', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.engine).toBe('financial-engine-decimal-20');
  });

  it('calculates intra-state GST (CGST + SGST split) accurately on the backend', async () => {
    const req = createPostRequest({
      currency: 'INR',
      senderState: '09 - Uttar Pradesh',
      clientState: '09 - Uttar Pradesh',
      items: [
        {
          id: '1',
          description: 'Consulting Services',
          quantity: 2,
          unitPrice: 1000,
          taxRate: 18,
        },
      ],
      enableRoundOff: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.summary.taxableSubtotal).toBe(2000);
    expect(data.summary.totalTax).toBe(360);
    expect(data.summary.grandTotal).toBe(2360);
    expect(data.supplyType).toBe('intra_state');

    // Check CGST and SGST split
    expect(data.summary.cgstTotal).toBe(180);
    expect(data.summary.sgstTotal).toBe(180);
    expect(data.summary.igstTotal).toBe(0);
    expect(data.summary.taxBreakdown[0].cgstAmount).toBe(180);
    expect(data.summary.taxBreakdown[0].sgstAmount).toBe(180);
  });

  it('calculates inter-state GST (IGST) accurately on the backend', async () => {
    const req = createPostRequest({
      currency: 'INR',
      senderState: '09 - Uttar Pradesh',
      clientState: '27 - Maharashtra',
      items: [
        {
          id: '1',
          description: 'Server Hosting',
          quantity: 1,
          unitPrice: 5000,
          taxRate: 18,
        },
      ],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.summary.taxableSubtotal).toBe(5000);
    expect(data.summary.totalTax).toBe(900);
    expect(data.summary.grandTotal).toBe(5900);
    expect(data.supplyType).toBe('inter_state');

    expect(data.summary.igstTotal).toBe(900);
    expect(data.summary.cgstTotal).toBe(0);
    expect(data.summary.sgstTotal).toBe(0);
    expect(data.summary.taxBreakdown[0].igstAmount).toBe(900);
  });

  it('rejects invalid, negative, or malformed inputs securely', async () => {
    const req = createPostRequest({
      currency: 'INR',
      items: [
        {
          quantity: -5, // Invalid negative
          unitPrice: 100,
        },
      ],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Validation failed');
  });

  it('handles discounts, round-off and extra charges with decimal precision', async () => {
    const req = createPostRequest({
      currency: 'INR',
      items: [
        {
          quantity: 3,
          unitPrice: 333.33,
          discountType: 'percentage',
          discountValue: 10,
          taxRate: 18,
        },
      ],
      shippingFee: 50,
      extraCharges: 25,
      enableRoundOff: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(typeof data.summary.roundOffAmount).toBe('number');
    expect(data.summary.grandTotal).toBe(Math.round(data.summary.grandTotal));
  });
});
