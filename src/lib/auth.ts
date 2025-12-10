// src/lib/auth.ts
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/totp';
import type { DatabaseUser } from '@/types/auth';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Mot de passe', type: 'password' },
                token: { label: 'Code 2FA', type: 'text' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    // 1. Fetch user
                    const result = await db.query<DatabaseUser & { pharmacy_name?: string }>(
                        `SELECT u.*, (SELECT name FROM data_pharmacy WHERE id = u.pharmacy_id) as pharmacy_name 
             FROM data_user u WHERE u.email = $1`,
                        [credentials.email]
                    );
                    const user = result.rows[0];

                    // 2. Validate Password
                    if (!user || !(await bcrypt.compare(credentials.password, user.password_hash))) {
                        return null;
                    }

                    // 3. Handle 2FA
                    if (user.two_factor_enabled) {
                        const token = credentials.token;
                        if (!token) throw new Error('2FA_REQUIRED');
                        if (!verifyToken(token, user.two_factor_secret!)) throw new Error('INVALID_2FA_TOKEN');
                    }

                    // 4. Return Session User
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        pharmacyId: user.pharmacy_id,
                        pharmacyName: user.pharmacy_name || null,
                        twoFactorEnabled: user.two_factor_enabled
                    };
                } catch (error) {
                    console.error('Auth Error:', error);
                    throw error;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.pharmacyId = user.pharmacyId;
                token.pharmacyName = user.pharmacyName;
                token.twoFactorEnabled = Boolean(user.twoFactorEnabled);
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.pharmacyId = token.pharmacyId as string | null;
                session.user.pharmacyName = token.pharmacyName as string | null;
                session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled);
            }
            return session;
        }
    },
    pages: { signIn: '/login', error: '/login' },
    secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me',
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
};
