// src/app/(dashboard)/layout.tsx
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

interface DashboardLayoutProps {
  readonly children: ReactNode;
}

/**
 * Layout Dashboard - Protection côté serveur pour toutes les routes dashboard
 * 
 * Sécurité defense-in-depth :
 * - Middleware intercepte côté edge
 * - Layout vérifie côté serveur
 * - Double protection performance
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);
  
  // Redirection si pas de session (fallback middleware)
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      {children}
    </>
  );
}