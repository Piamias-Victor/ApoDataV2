// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Protection routes admin - Admin seulement
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Protection routes dashboard - Tous utilisateurs connectés
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

    // Redirection dashboard si connecté sur login
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Routes publiques toujours autorisées
        if (pathname === '/' || pathname === '/login') {
          return true;
        }
        
        // Routes protégées nécessitent token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Matcher pour toutes les routes sauf :
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (png, jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};