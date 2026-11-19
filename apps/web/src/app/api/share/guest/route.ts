import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSignedToken, getSessionSecret } from '@/lib/auth/admin-session';
import { handleErrors, json } from '@/lib/server/api-helpers';
import { getItem, putItem } from '@/lib/server/workspace-data';

export const dynamic = 'force-dynamic';

const GuestShareSchema = z.object({
  document: z.object({
    id: z.string().min(1).max(200),
    documentNumber: z.string().optional(),
  }).passthrough(),
});

/** Stores an anonymous/guest invoice and returns a signed share token so any recipient can open it */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = GuestShareSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Invalid invoice payload.' }, 400);
  }

  const { document } = parsed.data;
  const docId = document.id;
  const secret = getSessionSecret();

  return handleErrors(async () => {
    await putItem('guest', {
      collection: 'documents',
      id: docId,
      updatedAt: new Date().toISOString(),
      data: document,
    });

    const token = await createSignedToken(
      {
        role: 'invoice_share',
        t: 'guest',
        d: docId,
      },
      secret
    );

    return json({
      token: `sv1.${token}`,
      docId,
    });
  });
}

/** Looks up an anonymous guest invoice directly by docId (for legacy or fallback share tokens) */
export async function GET(request: NextRequest) {
  const docId = new URL(request.url).searchParams.get('docId') || '';
  if (!docId) {
    return json({ error: 'Missing document ID.' }, 400);
  }

  return handleErrors(async () => {
    const item = await getItem('guest', 'documents', docId);
    if (!item || item.deleted) {
      return json({ error: 'This invoice could not be found or has been revoked.' }, 404);
    }

    return json({
      document: item.data,
      brand: { tenantId: 'guest', businessName: (item.data as any)?.sender?.name || 'Your Business' },
      isWhiteLabel: false,
      branding: {},
      plan: 'starter',
      canRemoveWatermark: false,
    });
  });
}
