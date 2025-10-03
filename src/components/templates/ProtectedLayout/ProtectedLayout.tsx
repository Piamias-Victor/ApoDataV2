// src/components/templates/ProtectedLayout/ProtectedLayout.tsx
'use client';

import React from 'react';
import { useTwoFactorCheck } from '@/hooks/auth/useTwoFactorCheck';
import { TwoFactorRequiredModal } from '@/components/molecules/TwoFactorRequiredModal/TwoFactorRequiredModal';

interface ProtectedLayoutProps {
  readonly children: React.ReactNode;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { requiresTwoFactor, isLoading } = useTwoFactorCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      {children}
      <TwoFactorRequiredModal isOpen={requiresTwoFactor} />
    </>
  );
};