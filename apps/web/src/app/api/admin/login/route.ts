import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  createAdminSession,
  getSessionSecret,
} from '@/lib/auth/admin-session';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Per-server-instance limit. On multi-instance hosting, use a shared store as well.
const attempts = new Map<string, { count: number; lockedUntil: number }>();

function matches(a: string, b: string): boolean {
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export async function POST(request: NextRequest) {
  const adminEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || '';
  const secret = getSessionSecret();

  if (!adminEmail || !adminPassword || !secret) {
    return NextResponse.json(
      { error: 'Admin sign-in is not set up. Add the admin settings to the server environment.' },
      { status: 503 }
    );
  }

  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const record = attempts.get(client);
  if (record && record.lockedUntil > Date.now()) {
    const minutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429 }
    );
  }

  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = String(body?.email || '').trim().toLowerCase();
    password = String(body?.password || '');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Evaluate both checks every time so the response doesn't reveal which one failed.
  const emailOk = matches(email, adminEmail);
  const passwordOk = matches(password, adminPassword);

  if (!emailOk || !passwordOk) {
    const count = (record?.count || 0) + 1;
    attempts.set(client, {
      count: count >= MAX_ATTEMPTS ? 0 : count,
      lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
    });
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  attempts.delete(client);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, await createAdminSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}
