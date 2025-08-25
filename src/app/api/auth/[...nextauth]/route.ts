// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import type { DatabaseUser } from '@/types/auth';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await db.query<DatabaseUser & { pharmacy_name?: string }>(
            `SELECT 
              u.id, u.email, u.name, u.password_hash, u.role, u.pharmacy_id,
              (SELECT name FROM data_pharmacy WHERE id = u.pharmacy_id) as pharmacy_name
             FROM data_user u
             WHERE u.email = $1`,
            [credentials.email]
          );

          const user = result[0];
          
          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            return null;
          }
          
          await db.query(
            'UPDATE data_user SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
            [user.id]
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pharmacyId: user.pharmacy_id,
            pharmacyName: user.pharmacy_name || null
          };
        } catch (error) {
          console.error('Erreur authentification:', error);
          return null;
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user' | 'viewer';
        session.user.pharmacyId = token.pharmacyId as string | null;
        session.user.pharmacyName = token.pharmacyName as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };