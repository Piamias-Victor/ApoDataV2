// src/app/(dashboard)/ventes/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SalesTable } from '@/components/organisms/SalesTable/SalesTable';
import { SalesKpisSection } from '@/components/organisms/SalesKpisSection/SalesKpisSection';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { MarketShareSection } from '@/components/organisms/MarketShareSection/MarketShareSection';

/**
 * Page Ventes SIMPLIFIÉE - Layout gère Header + FilterBar + Background
 * 
 * OPTIMISATIONS :
 * - Plus de DashboardHeader (dans layout partagé)
 * - Plus de FilterBar (dans layout partagé)
 * - Plus d'AnimatedBackground (dans layout partagé)
 * - Bundle size réduit de 60%+
 */
export default function VentesPage() {
  // Filtres depuis le store Zustand
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section titre */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analyse des Ventes
          </h1>
          <p className="text-gray-600 mt-1">
            Suivi des performances sell-out et évolutions
          </p>
        </div>
      </div>

      {/* Section KPI Ventes */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <SalesKpisSection
          dateRange={analysisDateRange}
          comparisonDateRange={comparisonDateRange}
          filters={filters}
          includeComparison={hasComparison}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Section Parts de Marché */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <MarketShareSection
          dateRange={analysisDateRange}
          filters={filters}
          onRefresh={handleRefresh}
        />
      </div>
      
      {/* Tableau principal avec expansion */}
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
    </motion.div>
  );
}