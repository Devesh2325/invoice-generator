import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { PlatformStore } from '@/lib/server/platform-store';
import { clientIp, handleErrors, isAdminRequest, json, unauthorized } from '@/lib/server/api-helpers';
import { getSiteSettings, writeAudit } from '@/lib/server/settings';

const BodySchema = z
  .object({
    disabledTemplates: z.array(z.string().max(60)).max(200),
    generator: z.record(z.boolean()),
  })
  .partial();

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid settings.' }, 400);
  return handleErrors(async () => {
    await PlatformStore.put('settings_site', 'settings', { ...(await getSiteSettings()), ...parsed.data });
    await writeAudit('UPDATE_SITE_SETTINGS', Object.keys(parsed.data).join(', '), clientIp(request));
    return json({ ok: true });
  });
}
