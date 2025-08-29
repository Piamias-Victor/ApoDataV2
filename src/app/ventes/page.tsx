// src/app/ventes/page.tsx
'use client';

import React, { useMemo } from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { SalesTable } from '@/components/organisms/SalesTable/SalesTable';
import { SalesKpisSection } from '@/components/organisms/SalesKpisSection/SalesKpisSection';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { MarketShareSection } from '@/components/organisms/MarketShareSection/MarketShareSection';

/**
 * Page Ventes - Analyse détaillée des ventes produits avec KPI
 * Architecture identique aux autres pages dashboard avec intégration filtres globaux
 */
export default function VentesPage(): JSX.Element {
  // Filtres depuis le store Zustand - identique dashboard/page.tsx
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Filtres formatés pour SalesKpisSection
  const filters = useMemo(() => ({
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  }), [productsFilter, laboratoriesFilter, categoriesFilter, pharmacyFilter]);

  // Vérification si comparaison est active
  const hasComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

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
          
          {/* NOUVEAU : Section KPI Ventes avec 4 DualKpiCard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <SalesKpisSection
              dateRange={analysisDateRange}
              comparisonDateRange={comparisonDateRange}
              filters={filters}
              includeComparison={hasComparison}
              onRefresh={handleRefresh}
            />
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <MarketShareSection
              dateRange={analysisDateRange}
              filters={filters}
              onRefresh={handleRefresh}
            />
          </div>
          
          {/* Tableau principal avec expansion - EXISTANT */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Analyse Détaillée des Ventes
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Vue complète des performances par produit
              </p>
            </div>

            <SalesTable 
              onRefresh={handleRefresh}
            />
          </div>
          
        </div>
      </main>
    </div>
  );
}