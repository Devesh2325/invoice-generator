import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, getSessionSecret, isValidAdminSession } from '@/lib/auth/admin-session';

/** Blocks every admin page on the server unless the request has a valid signed session. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  const authorized = await isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value, getSessionSecret());
  if (authorized) return NextResponse.next();

  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
