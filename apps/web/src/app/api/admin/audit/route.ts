import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { AdminSystemAuditLog } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';
import { handleErrors, isAdminRequest, json, unauthorized } from '@/lib/server/api-helpers';

const ImportSchema = z.object({
  logs: z
    .array(
      z.object({
        id: z.string().max(100),
        actor: z.string().max(200),
        action: z.string().max(100),
        target: z.string().max(500),
        timestamp: z.string().max(40),
        ipAddress: z.string().max(60).optional(),
      })
    )
    .max(500),
});

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return handleErrors(async () => {
    const records = await PlatformStore.list<AdminSystemAuditLog>('audit');
    return json({ logs: records.map((record) => record.data).sort((a, b) => b.timestamp.localeCompare(a.timestamp)) });
  });
}

/** Keeps history from before the log moved to the server. */
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = ImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid logs.' }, 400);
  return handleErrors(async () => {
    for (const log of parsed.data.logs) {
      const id = `aud_import_${log.id}`.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 36);
      await PlatformStore.put(id, 'audit', log);
    }
    return json({ ok: true });
  });
}
