import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES  = ['/login'];
const ADMIN_ROUTES   = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('sf_access_token')?.value ?? null;

  // Penanganan akses ke root (/) langsung
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute  = ADMIN_ROUTES.some((r)  => pathname.startsWith(r));

  // Jika sudah login + mencoba ke halaman login → arahkan ke dashboard
  if (isPublicRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Jika belum login + mencoba ke protected route → arahkan ke login
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