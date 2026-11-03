import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { AdminInquiry } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';
import { canAccessWorkspace, handleErrors, isRateLimited, json } from '@/lib/server/api-helpers';
import { getWorkspace } from '@/lib/server/workspaces';

const BodySchema = z.object({ plan: z.enum(['starter', 'pro', 'enterprise']) });

/** Asks the super admin to change a plan. It goes to the inbox, so choosing a plan can't unlock it by itself. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  if (isRateLimited(request, 'plan-request', 5, 60 * 60 * 1000)) return json({ error: 'Please try again later.' }, 429);
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid plan.' }, 400);
  return handleErrors(async () => {
    const workspace = await getWorkspace(params.id);
    if (!workspace) return json({ error: 'Workspace not found.' }, 404);
    const id = `inq_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await PlatformStore.put<AdminInquiry>(id, 'inquiry', {
      id,
      name: workspace.name,
      email: workspace.ownerEmail,
      subject: `Plan change request: ${workspace.plan} to ${parsed.data.plan}`,
      message: `${workspace.name} (${workspace.id}) asked to move from ${workspace.plan} to ${parsed.data.plan}. Change it under Teams & Workspaces.`,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    return json({ ok: true }, 201);
  });
}
