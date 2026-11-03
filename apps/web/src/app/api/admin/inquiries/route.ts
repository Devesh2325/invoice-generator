import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { AdminInquiry } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';
import { clientIp, handleErrors, isAdminRequest, json, unauthorized } from '@/lib/server/api-helpers';
import { writeAudit } from '@/lib/server/settings';

const IdSchema = z.string().regex(/^inq_[A-Za-z0-9_-]{1,32}$/);
const PatchSchema = z.object({
  id: IdSchema,
  status: z.enum(['new', 'in_progress', 'resolved']),
  notes: z.string().max(5000).optional(),
});

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return handleErrors(async () => {
    const records = await PlatformStore.list<AdminInquiry>('inquiry');
    const inquiries = records.map((record) => record.data).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return json({ inquiries });
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid update.' }, 400);
  return handleErrors(async () => {
    const existing = await PlatformStore.get<AdminInquiry>(parsed.data.id);
    if (!existing) return json({ error: 'Inquiry not found.' }, 404);
    await PlatformStore.put(parsed.data.id, 'inquiry', {
      ...existing.data,
      status: parsed.data.status,
      notes: parsed.data.notes ?? existing.data.notes,
    });
    await writeAudit('UPDATE_INQUIRY', parsed.data.id, clientIp(request));
    return json({ ok: true });
  });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = IdSchema.safeParse(new URL(request.url).searchParams.get('id'));
  if (!parsed.success) return json({ error: 'Invalid inquiry.' }, 400);
  return handleErrors(async () => {
    await PlatformStore.remove(parsed.data);
    await writeAudit('DELETE_INQUIRY', parsed.data, clientIp(request));
    return json({ ok: true });
  });
}
