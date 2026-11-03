import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { canAccessWorkspace, handleErrors, json } from '@/lib/server/api-helpers';
import { getEmbedAccess, issueEmbedKey, normalizeOrigin, setEmbedOrigins } from '@/lib/server/embed-keys';
import { planFeature } from '@/lib/server/settings';
import { getWorkspace } from '@/lib/server/workspaces';

const BodySchema = z.object({ origins: z.array(z.string().max(300)).min(1).max(20) });

function parseOrigins(body: unknown): string[] | null {
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return null;
  const origins = parsed.data.origins.map(normalizeOrigin);
  return origins.every(Boolean) ? [...new Set(origins as string[])] : null;
}

async function allowed(id: string): Promise<boolean> {
  const workspace = await getWorkspace(id);
  return Boolean(workspace && workspace.status === 'active' && (await planFeature(workspace.plan, 'hasIntegrationDocs')));
}

const BAD_ORIGINS = 'Enter full website addresses, such as https://www.example.com. Only https works, except for localhost.';
const NOT_ON_PLAN = 'Your plan does not include integrations.';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  return handleErrors(async () => {
    const access = await getEmbedAccess(params.id);
    return json({
      allowed: await allowed(params.id),
      hasKey: Boolean(access),
      last4: access?.last4,
      origins: access?.origins || [],
    });
  });
}

/** Creates a key, or replaces the current one so the old one stops working. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  const origins = parseOrigins(await request.json().catch(() => null));
  if (!origins) return json({ error: BAD_ORIGINS }, 400);
  return handleErrors(async () => {
    if (!(await allowed(params.id))) return json({ error: NOT_ON_PLAN }, 403);
    return json({ key: await issueEmbedKey(params.id, origins), origins }, 201);
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  const origins = parseOrigins(await request.json().catch(() => null));
  if (!origins) return json({ error: BAD_ORIGINS }, 400);
  return handleErrors(async () => {
    if (!(await allowed(params.id))) return json({ error: NOT_ON_PLAN }, 403);
    if (!(await setEmbedOrigins(params.id, origins))) return json({ error: 'Create a key first.' }, 404);
    return json({ origins });
  });
}
