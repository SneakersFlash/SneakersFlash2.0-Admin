import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const isLoginPage = request.nextUrl.pathname === '/';

    // 1. Jika user belum login tapi mau akses dashboard -> Tendang ke Login
    if (!token && !isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Jika user SUDAH login tapi mau akses halaman login -> Lempar ke Dashboard
    if (token && isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url)); // Ganti /dashboard sesuai route utama Anda
    }

    return NextResponse.next();
}

// Tentukan rute mana yang kena middleware ini
export const config = {
    matcher: ['/', '/dashboard/:path*'],
};