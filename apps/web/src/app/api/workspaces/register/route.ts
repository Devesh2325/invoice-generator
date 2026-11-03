import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleErrors, isRateLimited, json, setWorkspaceCookie } from '@/lib/server/api-helpers';
import { PasswordHashSchema, WorkspaceIdSchema, findByEmail, getWorkspace, saveWorkspace, toPublicConfig } from '@/lib/server/workspaces';

const RegisterSchema = z.object({
  id: WorkspaceIdSchema,
  name: z.string().trim().min(1).max(120),
  ownerEmail: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  ownerPasswordHash: PasswordHashSchema,
});

/** Public, so a signup always starts on the free plan with no white-label, whatever the request says. */
export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'register', 10, 60 * 60 * 1000)) {
    return json({ error: 'Too many signups. Please try again later.' }, 429);
  }
  const parsed = RegisterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Please check your details.' }, 400);
  return handleErrors(async () => {
    if (await findByEmail(parsed.data.ownerEmail)) {
      return json({ error: 'An account with this email already exists. Please sign in instead.' }, 409);
    }
    if (await getWorkspace(parsed.data.id)) return json({ error: 'Please try again.' }, 409);
    const now = new Date().toISOString();
    const workspace = {
      ...parsed.data,
      plan: 'starter' as const,
      status: 'active' as const,
      isWhiteLabel: false,
      branding: {},
      createdAt: now,
      updatedAt: now,
    };
    await saveWorkspace(workspace);
    return setWorkspaceCookie(json({ workspace: toPublicConfig(workspace) }, 201), workspace.id);
  });
}
