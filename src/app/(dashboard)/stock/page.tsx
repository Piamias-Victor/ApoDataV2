// src/app/(dashboard)/commandes/page.tsx
'use client';

import React, { useMemo } from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ProductsMonthlyTable } from '@/components/organisms/ProductsMonthlyTable/ProductsMonthlyTable';
import { StockMetricsSection } from '@/components/organisms/StockMetricsSection/StockMetricsSection';
import { StockChartsEvolution } from '@/components/organisms/StockChartsEvolution/StockChartsEvolution';
import { useFiltersStore } from '@/stores/useFiltersStore';

/**
 * Stock Page - Analyse détaillée des stocks et commandes produits
 */
export default function StockPage(): JSX.Element {
  // Store filtres
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Filtres pour les composants
  const filters = {
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  };

  // Fusion codes produits pour graphique : products + laboratories + categories
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

  // Comparaison active si dates définies
  const includeComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  const handleRefresh = () => {
    console.log('Refresh stock page');
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
                Gestion Stock
              </h1>
              <p className="text-gray-600 mt-1">
                Analyse 12 mois, stock idéal et quantités à commander par produit
              </p>
            </div>
          </div>

          {/* Section KPI Stock */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg">
            <StockMetricsSection
              dateRange={analysisDateRange}
              comparisonDateRange={includeComparison ? comparisonDateRange : undefined}
              filters={filters}
              includeComparison={includeComparison}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Graphique évolution stock */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <StockChartsEvolution
              dateRange={analysisDateRange}
              filters={chartFilters}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Tableau principal */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Détail par Produit
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Analyse 12 mois, stock actuel et recommandations de commande
              </p>
            </div>
            
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