// src/components/molecules/UserCreateForm.tsx
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Button } from '@/components/atoms/Button/Button';
import { PharmacySelect } from '@/components/molecules/PharmacySelect';
import { USER_ROLES, type UserRole, type CreateUserRequest } from '@/types/user';

interface UserCreateFormProps {
  readonly onSubmit: (data: CreateUserRequest) => Promise<void>;
  readonly onCancel: () => void;
  readonly loading?: boolean;
}

export const UserCreateForm: React.FC<UserCreateFormProps> = ({
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as UserRole,
    pharmacyId: undefined as string | undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nom requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nom trop court (min 2 caractères)';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mot de passe trop court (min 8 caractères)';
    }

    if (formData.role !== 'admin' && !formData.pharmacyId) {
      newErrors.pharmacyId = 'Pharmacie requise pour les utilisateurs non-admin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
        role: formData.role,
        pharmacyId: formData.pharmacyId || null
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const roleOptions = Object.entries(USER_ROLES).map(([key, label]) => ({
    value: key,
    label
  }));

  const isAdmin = formData.role === 'admin';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Email */}
      <Input
        type="email"
        label="Email"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          setFormData(prev => ({ ...prev, email: e.target.value }))
        }
        error={errors.email}
        disabled={loading}
        required
        placeholder="utilisateur@pharmacie.fr"
      />

      {/* Nom */}
      <Input
        type="text"
        label="Nom complet"
        value={formData.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          setFormData(prev => ({ ...prev, name: e.target.value }))
        }
        error={errors.name}
        disabled={loading}
        required
        placeholder="Jean Dupont"
      />

      {/* Mot de passe */}
      <Input
        type="password"
        label="Mot de passe"
        value={formData.password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          setFormData(prev => ({ ...prev, password: e.target.value }))
        }
        error={errors.password}
        disabled={loading}
        required
        placeholder="Minimum 8 caractères"
      />

      {/* Rôle */}
      <Select
        label="Rôle"
        value={formData.role}
        onChange={(value: string) => {
          const newRole = value as UserRole;
          setFormData(prev => ({ 
            ...prev, 
            role: newRole,
            pharmacyId: newRole === 'admin' ? undefined : prev.pharmacyId
          }));
        }}
        options={roleOptions}
        disabled={loading}
        required
      />

      {/* Pharmacie (si pas admin) */}
      {!isAdmin && (
        <PharmacySelect
          value={formData.pharmacyId}
          onChange={(pharmacyId) => setFormData(prev => ({ ...prev, pharmacyId }))}
          required={!isAdmin}
          disabled={loading}
        />
      )}

      {errors.pharmacyId && (
        <p className="text-sm text-red-600">{errors.pharmacyId}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading}
          type="submit"
        >
          Créer l'utilisateur
        </Button>
      </div>
    </form>
  );
};