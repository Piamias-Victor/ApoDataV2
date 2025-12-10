// src/types/auth.ts
export interface UserRole {
    id: string;
    name: string;
}

export interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    image?: string | null;
    pharmacyId?: string | null;
    pharmacyName?: string | null;
    twoFactorEnabled?: boolean;
}

export interface DatabaseUser {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: string;
    pharmacy_id: string;
    two_factor_enabled: boolean;
    two_factor_secret?: string;
    created_at: Date;
    updated_at: Date;
}

declare module 'next-auth' {
    interface Session {
        user: User;
    }
    interface User {
        id: string;
        role?: string | undefined;
        pharmacyId?: string | null | undefined;
        pharmacyName?: string | null | undefined;
        twoFactorEnabled?: boolean | undefined;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role?: string | undefined;
        pharmacyId?: string | null | undefined;
        pharmacyName?: string | null | undefined;
        twoFactorEnabled?: boolean | undefined;
    }
}
