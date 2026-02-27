/**
 * src/proxy.ts
 *
 * Next.js 16 uses "proxy" instead of "middleware" (which is now deprecated).
 * Renamed from middleware.ts → proxy.ts
 *
 * Protects /dashboard/* routes — redirects unauthenticated users to /login.
 * Redirects already-authed users away from /login to /dashboard.
 */
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES  = ['/login'];
const ADMIN_ROUTES   = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('sf_access_token')?.value ?? null;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute  = ADMIN_ROUTES.some((r)  => pathname.startsWith(r));

  // Logged in + trying to reach login page → send to dashboard
  if (isPublicRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Not logged in + trying to reach protected route → send to login
  if (isAdminRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
