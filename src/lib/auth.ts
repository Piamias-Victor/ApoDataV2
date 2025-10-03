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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await db.query<DatabaseUser & { pharmacy_name?: string }>(
            `SELECT 
              u.id, u.email, u.name, u.password_hash, u.role, u.pharmacy_id,
              u.two_factor_enabled, u.two_factor_secret,
              (SELECT name FROM data_pharmacy WHERE id = u.pharmacy_id) as pharmacy_name
             FROM data_user u
             WHERE u.email = $1`,
            [credentials.email]
          );

          const user = result[0];
          
          console.log('🔐 Auth attempt:', {
            email: credentials.email,
            userFound: !!user,
            twoFactorEnabled: user?.two_factor_enabled,
            hasSecret: !!user?.two_factor_secret,
            tokenProvided: !!credentials.token
          });

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

          if (user.two_factor_enabled) {
            console.log('✅ 2FA required for user');
            const token = credentials.token;
            
            if (!token) {
              console.log('❌ No token provided');
              throw new Error('2FA_REQUIRED');
            }

            const isTokenValid = verifyToken(token, user.two_factor_secret!);
            
            console.log('🔑 Token validation:', { isTokenValid });
            
            if (!isTokenValid) {
              throw new Error('INVALID_2FA_TOKEN');
            }
          } else {
            console.log('⚠️ 2FA not enabled for user - will redirect to setup');
          }
          
          await db.query(
            'UPDATE data_user SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
            [user.id]
          );

          const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pharmacyId: user.pharmacy_id,
            pharmacyName: user.pharmacy_name || null,
            twoFactorEnabled: Boolean(user.two_factor_enabled)
          };

          console.log('👤 Authorize returning user:', {
            email: userResponse.email,
            twoFactorEnabled: userResponse.twoFactorEnabled,
            type: typeof userResponse.twoFactorEnabled
          });

          return userResponse;
        } catch (error) {
          console.error('❌ Auth error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        console.log('👤 User object received in JWT:', {
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          type: typeof user.twoFactorEnabled
        });
        
        token.id = user.id;
        token.role = user.role;
        token.pharmacyId = user.pharmacyId;
        token.pharmacyName = user.pharmacyName;
        token.twoFactorEnabled = Boolean(user.twoFactorEnabled ?? false);
        
        console.log('✅ Token set with twoFactorEnabled:', token.twoFactorEnabled);
      }

      if (token.twoFactorEnabled === undefined) {
        console.log('⚠️ twoFactorEnabled was undefined, forcing to false');
        token.twoFactorEnabled = false;
      }

      console.log('🔑 JWT callback result:', { 
        trigger, 
        hasUser: !!user,
        tokenEmail: token.email,
        twoFactorEnabled: token.twoFactorEnabled 
      });

      if (trigger === 'update') {
        console.log('🔄 Session update triggered - refreshing 2FA status');
        try {
          const result = await db.query(
            'SELECT two_factor_enabled FROM data_user WHERE id = $1',
            [token.id]
          );
          if (result[0]) {
            token.twoFactorEnabled = Boolean(result[0].two_factor_enabled ?? false);
            console.log('✅ Updated twoFactorEnabled:', token.twoFactorEnabled);
          }
        } catch (error) {
          console.error('❌ Error updating 2FA status:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user' | 'viewer';
        session.user.pharmacyId = token.pharmacyId as string | null;
        session.user.pharmacyName = token.pharmacyName as string | null;
        session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled ?? false);
      }
      
      console.log('📦 Session callback:', {
        email: session.user.email,
        twoFactorEnabled: session.user.twoFactorEnabled
      });

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
  debug: true,
};