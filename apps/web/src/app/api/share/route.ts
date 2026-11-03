import type { NextRequest } from 'next/server';
import { getSessionSecret, readSignedToken } from '@/lib/auth/admin-session';
import { handleErrors, json } from '@/lib/server/api-helpers';
import { getItem } from '@/lib/server/workspace-data';
import { cleanBranding, getWorkspace } from '@/lib/server/workspaces';

export const dynamic = 'force-dynamic';

/** Opens a shared invoice from a signed link. No sign-in, because the customer doesn't have an account. */
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const payload = token.startsWith('sv1.')
    ? await readSignedToken<{ role?: string; t?: string; d?: string }>(token.slice(4), getSessionSecret())
    : null;
  if (payload?.role !== 'invoice_share' || !payload.t || !payload.d) return json({ error: 'Invalid or expired invoice link.' }, 404);
  const { t: workspaceId, d: documentId } = payload;

  return handleErrors(async () => {
    const [item, brand, workspace] = await Promise.all([
      getItem(workspaceId, 'documents', documentId),
      getItem(workspaceId, 'brand', 'brand'),
      getWorkspace(workspaceId),
    ]);
    if (!item || item.deleted || !workspace || workspace.status !== 'active') {
      return json({ error: 'This invoice could not be found or has been revoked.' }, 404);
    }
    return json({
      document: item.data,
      brand: brand?.data || { tenantId: workspaceId },
      isWhiteLabel: workspace.isWhiteLabel,
      branding: workspace.isWhiteLabel ? cleanBranding(workspace.branding) : {},
    });
  });
}
