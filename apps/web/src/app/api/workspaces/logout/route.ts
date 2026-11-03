import { NextResponse } from 'next/server';
import { WORKSPACE_COOKIE } from '@/lib/auth/admin-session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(WORKSPACE_COOKIE);
  return response;
}
