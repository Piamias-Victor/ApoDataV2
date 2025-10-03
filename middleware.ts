// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    console.log('🚨 MIDDLEWARE EXECUTION:', {
      pathname,
      hasToken: !!token,
      twoFactorEnabled: token?.twoFactorEnabled,
      email: token?.email
    });

    if (token && !token.twoFactorEnabled && pathname !== '/setup-2fa' && pathname !== '/login') {
      console.log('🚀 REDIRECT TO /setup-2fa');
      return NextResponse.redirect(new URL('/setup-2fa', req.url));
    }

    if (token?.twoFactorEnabled && pathname === '/setup-2fa') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/ventes') || 
        pathname.startsWith('/stock') || 
        pathname.startsWith('/pricing') || 
        pathname.startsWith('/comparaisons')) {
      if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    if (pathname === '/login' && token) {
      if (!token.twoFactorEnabled) {
        console.log('🚀 REDIRECT FROM LOGIN TO /setup-2fa');
        return NextResponse.redirect(new URL('/setup-2fa', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    console.log('✅ MIDDLEWARE: pass through');
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        if (pathname === '/' || pathname === '/login' || pathname === '/setup-2fa') {
          return true;
        }
        
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/ventes/:path*',
    '/stock/:path*',
    '/pricing/:path*',
    '/comparaisons/:path*',
    '/admin/:path*',
    '/setup-2fa',
    '/login',
  ],
};