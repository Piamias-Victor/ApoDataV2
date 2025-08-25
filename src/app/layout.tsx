// src/app/layout.tsx
import type { Metadata } from 'next';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApoData Genesis - Dashboard Pharmaceutique',
  description: 'Plateforme BI ultra-performante pour pharmacies',
  keywords: 'pharmacie, BI, dashboard, sell-out, sell-in, stock',
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="min-h-screen bg-gray-50 antialiased">
        <SessionProvider>
          <div id="root" className="min-h-screen">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}