// src/types/auth.ts
import { DefaultSession, DefaultUser } from 'next-auth';

export type UserRole = 'admin' | 'user' | 'viewer';

export interface DatabaseUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly password_hash: string;
  readonly role: UserRole;
  readonly pharmacy_id: string | null;
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly last_login_at: Date | null;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly pharmacyId: string | null;
  readonly pharmacyName: string | null;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      pharmacyId: string | null;
      pharmacyName: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    pharmacyId: string | null;
    pharmacyName: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    pharmacyId: string | null;
    pharmacyName: string | null;
  }
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export type AuthError = 
  | 'CredentialsSignin'
  | 'InvalidCredentials'
  | 'AccountDisabled'
  | 'DatabaseError';