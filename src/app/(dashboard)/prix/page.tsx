// src/app/(dashboard)/prix/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PriceEvolutionChart } from '@/components/organisms/PriceEvolutionChart/PriceEvolutionChart';
import { CompetitiveTable } from '@/components/organisms/CompetitiveTable/CompetitiveTable';
import { PriceEvolutionKpis } from '@/components/organisms/PriceEvolutionKpis/PriceEvolutionKpis';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useCompetitiveAnalysis } from '@/hooks/competitive/useCompetitiveAnalysis';

/**
 * Page Prix SIMPLIFIÉE - Layout gère Header + FilterBar + Background
 * 
 * OPTIMISATIONS :
 * - Plus de DashboardHeader (dans layout partagé)
 * - Plus de FilterBar (dans layout partagé) 
 * - Plus d'AnimatedBackground (dans layout partagé)
 * - Bundle size réduit de 60%+
 */
export default function PrixPage() {
  // Récupération filtres store global
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fusion codes produits : products + laboratories + categories
  const allProductCodes = useMemo(() => {
    const codes = Array.from(new Set([
      ...productsFilter,
      ...laboratoriesFilter,
      ...categoriesFilter
    ]));
    return codes;
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);

  // Construction filtres pour graphique
  const chartFilters = {
    productCodes: allProductCodes,
    ...(pharmacyFilter.length > 0 && { pharmacyId: pharmacyFilter[0] })
  };

  // Hook analyse concurrentielle
  const {
    products: competitiveProducts,
    isLoading: isCompetitiveLoading,
    error: competitiveError,
    refetch: refetchCompetitive,
    hasData: hasCompetitiveData
  } = useCompetitiveAnalysis({
    enabled: true
  });

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
            Analyse des Prix et Concurrence
          </h1>
          <p className="text-gray-600 mt-1">
            Évolutions tarifaires, positionnement marché et analyse concurrentielle
          </p>
        </div>
        
        {/* Indicateurs filtres appliqués */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {productsFilter.length > 0 && (
            <span className="text-blue-600 font-medium">
              {productsFilter.length} produit{productsFilter.length > 1 ? 's' : ''} sélectionné{productsFilter.length > 1 ? 's' : ''}
            </span>
          )}
          {laboratoriesFilter.length > 0 && (
            <span className="text-purple-600 font-medium">
              {laboratoriesFilter.length} labo{laboratoriesFilter.length > 1 ? 's' : ''}
            </span>
          )}
          {categoriesFilter.length > 0 && (
            <span className="text-green-600 font-medium">
              {categoriesFilter.length} catégorie{categoriesFilter.length > 1 ? 's' : ''}
            </span>
          )}
          {pharmacyFilter.length > 0 && (
            <span className="text-orange-600 font-medium">
              {pharmacyFilter.length} pharmacie{pharmacyFilter.length > 1 ? 's' : ''}
            </span>
          )}
          {allProductCodes.length > 0 && (
            <span className="text-gray-700 font-medium bg-gray-200 px-2 py-1 rounded">
              {allProductCodes.length} codes EAN total
            </span>
          )}
        </div>
      </div>

      {/* KPIs évolutions prix */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <PriceEvolutionKpis />
      </div>

      {/* Graphique évolution prix */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Évolution des Prix Mensuels
        </h2>
        <PriceEvolutionChart
          dateRange={analysisDateRange}
          filters={chartFilters}
          className="w-full"
        />
      </div>
      
      {/* Analyse concurrentielle */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse Concurrentielle
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Comparaison de vos prix avec le groupement
            </p>
          </div>
          
          {/* Métriques résumé */}
          {hasCompetitiveData && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {competitiveProducts.length}
                </div>
                <div className="text-gray-500">Produits analysés</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {competitiveProducts.filter(p => p.ecart_prix_vs_marche_pct < -2).length}
                </div>
                <div className="text-gray-500">Prix compétitifs</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {competitiveProducts.filter(p => p.ecart_prix_vs_marche_pct > 5).length}
                </div>
                <div className="text-gray-500">Prix élevés</div>
              </div>
            </div>
          )}
        </div>
        
        <CompetitiveTable
          products={competitiveProducts}
          isLoading={isCompetitiveLoading}
          error={competitiveError}
          onRefresh={refetchCompetitive}
          className="w-full"
        />
      </div>
    </motion.div>
  );
}