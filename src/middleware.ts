// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(_req) {
        // Logique de redirection custom si nécessaire
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        '/hub/:path*',
        '/dashboard/:path*',
        // Ajoutez ici d'autres routes protégées
    ],
};
