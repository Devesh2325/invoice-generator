import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { calculateDocument, DiscountType, RoundingMode } from '@invoice/core';
import { handleErrors, json } from '@/lib/server/api-helpers';

export const dynamic = 'force-dynamic';

const LineItemSchema = z.object({
  id: z.string().max(100).optional(),
  description: z.string().max(500).optional().default(''),
  hsnCode: z.string().max(50).optional(),
  unit: z.string().max(30).optional(),
  quantity: z.number().finite().min(0).max(100_000_000).default(1),
  unitPrice: z.number().finite().min(0).max(1_000_000_000).default(0),
  taxRate: z.number().finite().min(0).max(100).default(0),
  taxInclusive: z.boolean().optional().default(false),
  discountType: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  discountValue: z.number().finite().min(0).default(0),
});

const CalculationRequestSchema = z.object({
  currency: z.string().max(10).optional().default('INR'),
  senderState: z.string().max(100).optional().default(''),
  clientState: z.string().max(100).optional().default(''),
  items: z.array(LineItemSchema).max(500).default([]),
  documentDiscountType: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  documentDiscountValue: z.number().finite().min(0).optional().default(0),
  shippingFee: z.number().finite().min(0).optional().default(0),
  extraCharges: z.number().finite().min(0).optional().default(0),
  amountPaid: z.number().finite().min(0).optional().default(0),
  refundedAmount: z.number().finite().min(0).optional().default(0),
  enableRoundOff: z.boolean().optional().default(true),
  roundingMode: z.enum(['nearest_integer', 'half_even', 'up', 'down', 'half_up']).optional(),
  decimalPrecision: z.number().int().min(0).max(6).optional(),
});

/**
 * Public calculation status check.
 */
export async function GET() {
  return json({
    ok: true,
    status: 'active',
    engine: 'financial-engine-decimal-20',
    precision: 20,
    supportedGstRules: ['intra_state_cgst_sgst', 'inter_state_igst', 'tax_inclusive_backward', 'proportional_discount'],
  });
}

/**
 * Authoritative Server-Side Calculation Endpoint.
 * Computes exact financial totals, line items, and GST/tax breakdown using decimal.js on the backend.
 */
export async function POST(request: NextRequest) {
  return handleErrors(async () => {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return json({ error: 'Invalid request body. Expected JSON object.' }, 400);
    }

    const parseResult = CalculationRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return json(
        {
          error: 'Validation failed for calculation input.',
          details: parseResult.error.flatten(),
        },
        400
      );
    }

    const data = parseResult.data;

    // Execute server-side deterministic calculation
    const result = calculateDocument({
      currency: data.currency,
      senderState: data.senderState,
      clientState: data.clientState,
      items: data.items.map((item, idx) => ({
        id: item.id || String(idx + 1),
        description: item.description,
        hsnCode: item.hsnCode,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxInclusive: item.taxInclusive,
        discountType: item.discountType as DiscountType,
        discountValue: item.discountValue,
      })),
      documentDiscountType: data.documentDiscountType as DiscountType,
      documentDiscountValue: data.documentDiscountValue,
      shippingFee: data.shippingFee,
      extraCharges: data.extraCharges,
      amountPaid: data.amountPaid,
      refundedAmount: data.refundedAmount,
      enableRoundOff: data.enableRoundOff,
      roundingMode: data.roundingMode as RoundingMode,
      decimalPrecision: data.decimalPrecision,
    });

    return json({
      ok: true,
      items: result.items,
      summary: result.summary,
      calculatedAt: new Date().toISOString(),
      supplyType: result.summary.gstSupplyType === 'inter' ? 'inter_state' : 'intra_state',
    });
  });
}
