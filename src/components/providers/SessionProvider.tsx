// src/components/providers/SessionProvider.tsx
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  readonly children: React.ReactNode;
  readonly session?: Session | null | undefined;
}

/**
 * SessionProvider - Wrapper NextAuth pour l'application
 * 
 * Fournit le contexte de session à toute l'application
 * avec gestion des états de chargement et d'erreur
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  session
}) => {
  return (
    <NextAuthSessionProvider
      session={session ?? null}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
};