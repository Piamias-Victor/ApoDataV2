// src/app/(dashboard)/commandes/page.tsx
'use client';

import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ProductsMonthlyTable } from '@/components/organisms/ProductsMonthlyTable/ProductsMonthlyTable';

/**
 * Commandes Page - Analyse détaillée des commandes produits
 */
export default function CommandesPage(): JSX.Element {
  const handleRefresh = () => {
    console.log('Refresh commandes page');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-8 space-y-8">
          
          {/* Section titre */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analyse Détaillée des Commandes
              </h1>
              <p className="text-gray-600 mt-1">
                Synthèse 12 mois et évolutions mensuelles par produit
              </p>
            </div>
          </div>

          {/* Tableau principal */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <ProductsMonthlyTable 
              onRefresh={handleRefresh}
              className="w-full"
            />
          </div>
          
        </div>
      </main>
    </div>
  );
}