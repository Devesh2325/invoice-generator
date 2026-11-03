import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  WORKSPACE_COOKIE,
  WORKSPACE_SESSION_SECONDS,
  createWorkspaceSession,
  getSessionSecret,
  isValidAdminSession,
  readWorkspaceSession,
} from '@/lib/auth/admin-session';
import { getWorkspace } from './workspaces';
import { StoreUnavailableError } from './platform-store';

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** Runs a route and turns storage problems into a response the page can explain. */
export async function handleErrors(run: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof StoreUnavailableError) {
      return json({ error: 'Shared storage is not connected.', code: 'store_unavailable' }, 503);
    }
    console.error('Platform API error:', error);
    return json({ error: 'Something went wrong. Please try again.', code: 'store_error' }, 502);
  }
}

/** Middleware only guards admin pages, so each admin API route checks the session itself. */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value, getSessionSecret());
}

export const unauthorized = () => json({ error: 'Please sign in as super admin.' }, 401);

/** The workspace's own signed-in, active owner, or the super admin. Everyone else gets nothing. */
export async function canAccessWorkspace(request: NextRequest, workspaceId: string): Promise<boolean> {
  if (await isAdminRequest(request)) return true;
  const signedIn = await readWorkspaceSession(request.cookies.get(WORKSPACE_COOKIE)?.value, getSessionSecret());
  if (signedIn !== workspaceId) return false;
  try {
    return (await getWorkspace(workspaceId))?.status === 'active';
  } catch {
    return false;
  }
}

export async function setWorkspaceCookie(response: NextResponse, workspaceId: string): Promise<NextResponse> {
  const secret = getSessionSecret();
  if (!secret) return response;
  response.cookies.set(WORKSPACE_COOKIE, await createWorkspaceSession(workspaceId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: WORKSPACE_SESSION_SECONDS,
  });
  return response;
}

export const clientIp = (request: NextRequest) => request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || undefined;

const hits = new Map<string, { count: number; resetAt: number }>();

/** A basic per-instance limit for public forms. It slows abuse down rather than stopping it outright. */
export function isRateLimited(request: NextRequest, scope: string, limit: number, windowMs: number): boolean {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
  const key = `${scope}:${forwarded}`;
  const now = Date.now();
  if (hits.size > 5000) hits.forEach((value, k) => value.resetAt <= now && hits.delete(k));
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
