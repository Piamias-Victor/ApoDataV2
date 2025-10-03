// src/hooks/auth/useTwoFactorCheck.ts
'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export const useTwoFactorCheck = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;
  
  // Pages exclues de la modal
  const excludedPaths = ['/login', '/setup-2fa', '/'];
  const isExcludedPath = excludedPaths.includes(pathname);

  const requiresTwoFactor = isAuthenticated && !twoFactorEnabled && !isExcludedPath;

  return {
    isLoading,
    isAuthenticated,
    twoFactorEnabled,
    requiresTwoFactor
  };
};