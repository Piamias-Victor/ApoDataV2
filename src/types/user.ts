// src/types/user.ts
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'admin' | 'user' | 'viewer';
  readonly pharmacyId: string | null;
  readonly pharmacyName?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt: string | null;
  readonly deletedAt?: string | null;
}

export interface CreateUserRequest {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly role: 'admin' | 'user' | 'viewer';
  readonly pharmacyId?: string | null; // Corrigé pour accepter null
}

export interface CreateUserResponse {
  readonly user: User;
  readonly message: string;
}

export type UserRole = 'admin' | 'user' | 'viewer' | 'pharmacy_user';

export const USER_ROLES: Record<UserRole, string> = {
  admin: 'Administrateur',
  user: 'Utilisateur',
  viewer: 'Lecteur',
  pharmacy_user: 'Pharmacien'
} as const;

export interface UserUpdateData {
  readonly role?: 'admin' | 'user' | 'viewer';
  readonly pharmacyId?: string | null;
}

export interface UsersResponse {
  readonly users: User[];
  readonly pagination: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalItems: number;
    readonly itemsPerPage: number;
  };
}

export interface UserFilters {
  readonly search?: string;
  readonly role?: UserRole;
  readonly includeDeleted?: boolean;
  readonly page?: number;
  readonly limit?: number;
}