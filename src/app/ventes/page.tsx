// src/app/ventes/page.tsx
'use client';

import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { SalesTable } from '@/components/organisms/SalesTable/SalesTable';

/**
 * Page Ventes - Analyse détaillée des ventes produits
 * Architecture identique aux autres pages dashboard avec intégration filtres globaux
 */
export default function VentesPage(): JSX.Element {
  const handleRefresh = () => {
    console.log('Refresh ventes page');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé */}
      <AnimatedBackground />
      
      {/* Header avec filtres */}
      <DashboardHeader />

      <div className='h-40'>Test</div>
      
      {/* Contenu principal */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="space-y-8">
          
          {/* Tableau principal avec expansion */}
          <SalesTable 
            onRefresh={handleRefresh}
          />
          
        </div>
      </main>
    </div>
  );
}