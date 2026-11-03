import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { PlanOverrides } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';
import { clientIp, handleErrors, isAdminRequest, json, unauthorized } from '@/lib/server/api-helpers';
import { writeAudit } from '@/lib/server/settings';

const count = z.number().int().min(0).max(99999);
const price = z.number().min(0).max(100000000);
const PlanSchema = z
  .object({
    priceMonthly: price,
    priceYearly: price,
    maxMembers: count,
    maxInvoicesPerMonth: count,
    hasAllTemplates: z.boolean(),
    canRemoveWatermark: z.boolean(),
    hasPrioritySupport: z.boolean(),
    hasIntegrationDocs: z.boolean(),
    hasWhiteLabel: z.boolean(),
  })
  .partial();
const PlansSchema = z.object({ starter: PlanSchema, pro: PlanSchema, enterprise: PlanSchema }).partial();

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = PlansSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Please check the plan values.' }, 400);
  return handleErrors(async () => {
    await PlatformStore.put<PlanOverrides>('settings_plans', 'settings', parsed.data);
    await writeAudit('UPDATE_PLAN_LIMITS', 'Plans', clientIp(request));
    return json({ ok: true });
  });
}
