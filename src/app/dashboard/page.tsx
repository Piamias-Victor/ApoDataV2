// src/app/dashboard/page.tsx
import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';

/**
 * Dashboard Page - Page principale du dashboard ApoData
 * 
 * Layout avec header dashboard, background animé et contenu vide pour l'instant
 */
export default function DashboardPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header dashboard */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header */}
      <main className="relative z-10 pt-20">
        {/* Contenu vide pour l'instant */}
        <div className="container-apodata py-8">
          <div className="text-center text-gray-500">
            <p>Contenu du dashboard à venir...</p>
          </div>
        </div>
      </main>
    </div>
  );
}