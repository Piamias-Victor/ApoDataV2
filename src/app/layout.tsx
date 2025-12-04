import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { PharmacyProvider } from '@/providers/PharmacyProvider';
import { ProtectedLayout } from '@/components/templates/ProtectedLayout/ProtectedLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApoData Genesis - Dashboard Pharmaceutique',
  description: 'Plateforme BI ultra-performante pour pharmacies',
  keywords: 'pharmacie, BI, dashboard, sell-out, sell-in, stock',
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="fr" className="scroll-smooth">
      <body className="min-h-screen bg-gray-50 antialiased">
        <SessionProvider session={session}>
          <PharmacyProvider>
            <ProtectedLayout>
              <div id="root" className="min-h-screen">
                {children}
              </div>
            </ProtectedLayout>
          </PharmacyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}