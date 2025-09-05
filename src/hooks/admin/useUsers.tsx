// src/hooks/admin/useUsers.tsx
'use client';

import { useState, useCallback } from 'react';
import type { User } from '@/types/user';

interface UseUsersReturn {
  readonly users: User[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly createUser: (userData: any) => Promise<void>;
  readonly refreshUsers: () => Promise<void>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur de chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data.users || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: any) => {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur de création');
    }

    await refreshUsers();
  }, [refreshUsers]);

  return {
    users,
    loading,
    error,
    createUser,
    refreshUsers
  };
};