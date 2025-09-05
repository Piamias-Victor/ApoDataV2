// src/types/user.ts
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'admin' | 'user' | 'viewer';
  readonly pharmacyId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt: string | null;
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

export type UserRole = 'admin' | 'user' | 'viewer';

export const USER_ROLES: Record<UserRole, string> = {
  admin: 'Administrateur',
  user: 'Utilisateur',
  viewer: 'Lecteur'
} as const;