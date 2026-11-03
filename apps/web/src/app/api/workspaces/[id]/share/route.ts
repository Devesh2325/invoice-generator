import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSignedToken, getSessionSecret } from '@/lib/auth/admin-session';
import { canAccessWorkspace, handleErrors, json } from '@/lib/server/api-helpers';
import { getItem } from '@/lib/server/workspace-data';

const BodySchema = z.object({ documentId: z.string().min(1).max(200) });

/** Signs a link for one invoice, so nobody can build a link just from knowing or guessing its IDs. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  const secret = getSessionSecret();
  if (!parsed.success) return json({ error: 'Invalid invoice.' }, 400);
  if (!secret) return json({ error: 'Sharing is not set up.' }, 503);
  return handleErrors(async () => {
    const item = await getItem(params.id, 'documents', parsed.data.documentId);
    if (!item || item.deleted) return json({ error: 'This invoice has not been saved yet.' }, 404);
    const token = await createSignedToken({ role: 'invoice_share', t: params.id, d: parsed.data.documentId }, secret);
    return json({ token: `sv1.${token}` });
  });
}
