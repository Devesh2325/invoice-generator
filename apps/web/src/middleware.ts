import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, getSessionSecret, isValidAdminSession } from '@/lib/auth/admin-session';

/** Blocks every admin page on the server unless the request has a valid signed session. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/embed') return embedResponse(request);
  if (pathname === '/admin/login') return NextResponse.next();

  const authorized = await isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value, getSessionSecret());
  if (authorized) return NextResponse.next();

  return NextResponse.redirect(new URL('/admin/login', request.url));
}

/**
 * Browsers refuse to show /embed inside any site not listed here. Without a valid key, or if the check
 * fails, only this site can show it, which is what keeps integrations to the plans that include them.
 */
async function embedResponse(request: NextRequest) {
  let origins: string[] = [];
  const key = request.nextUrl.searchParams.get('key');
  if (key) {
    try {
      const verify = new URL('/api/embed/verify', request.url);
      verify.searchParams.set('key', key);
      const res = await fetch(verify, { cache: 'no-store' });
      if (res.ok) origins = (await res.json()).origins || [];
    } catch {
      origins = [];
    }
  }
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', `frame-ancestors 'self' ${origins.join(' ')}`.trim());
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/embed'],
};
