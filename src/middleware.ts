import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

// Routes that require ADMIN role
const ADMIN_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken =
    request.cookies.get('sf_access_token')?.value ?? null;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // If user has a token and tries to access login → redirect to dashboard
  if (isPublicRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user has no token and tries to access a protected route → redirect to login
  if (isAdminRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
