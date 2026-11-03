import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth/password';
import { handleErrors, isRateLimited, json, setWorkspaceCookie } from '@/lib/server/api-helpers';
import { findByEmail, toPublicConfig } from '@/lib/server/workspaces';

const LoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(500),
});

/** Lets a workspace owner sign in from any browser, including workspaces the super admin created. */
export async function POST(request: NextRequest) {
  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Incorrect email or password.' }, 401);
  // Limited per account so password guessing is slow, with a higher limit per address so one office can't lock itself out.
  const window = 15 * 60 * 1000;
  const account = `workspace-login:${parsed.data.email.toLowerCase()}`;
  if (isRateLimited(request, account, 10, window) || isRateLimited(request, 'workspace-login', 200, window)) {
    return json({ error: 'Too many attempts. Please try again in a few minutes.' }, 429);
  }
  return handleErrors(async () => {
    const workspace = await findByEmail(parsed.data.email);
    if (!workspace?.ownerPasswordHash || !(await verifyPassword(workspace.ownerPasswordHash, parsed.data.password))) {
      return json({ error: 'Incorrect email or password.' }, 401);
    }
    if (workspace.status === 'suspended') {
      return json({ error: 'This workspace has been suspended. Please contact support.' }, 403);
    }
    return setWorkspaceCookie(json({ workspace: toPublicConfig(workspace) }), workspace.id);
  });
}
