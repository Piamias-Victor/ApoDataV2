// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ProductsTable } from '@/components/organisms/ProductsTable/ProductsTable';
import { useProductsList } from '@/hooks/products/useProductsList';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { Card } from '@/components/atoms/Card/Card';
import { KpisSection } from '@/components/organisms/KpisSection/KpisSection';
import DailyMetricsTest from '@/components/test/DailyMetricsTest';

/**
 * Dashboard Page - Avec intégration DailyMetricsTest
 */
export default function DashboardPage(): JSX.Element {
  // Récupération des vraies dates du store
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // État local pour afficher/masquer le test des métriques quotidiennes
  const [showDailyMetricsTest, setShowDailyMetricsTest] = React.useState(false);

  // Filtres formatés pour les hooks KPI
  const filters = {
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  };

  // Hook existant pour récupérer les données produits
  const { 
    products, 
    isLoading, 
    error,
    queryTime,
    cached,
    refetch
  } = useProductsList();

  // Handler refresh global
  const handleGlobalRefresh = () => {
    refetch();
  };

  // Calcul des totaux filtrés pour affichage
  const filteredCount = products.length;
  const hasActiveFilters = productsFilter.length > 0 || 
                          laboratoriesFilter.length > 0 || 
                          categoriesFilter.length > 0 || 
                          pharmacyFilter.length > 0;

  // Vérification si comparaison est active
  const hasComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-6 space-y-6">
          
          {/* Section titre dashboard - Compact */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard ApoData
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Performances pharmaceutiques en temps réel
              </p>
            </div>
            
            {/* Indicateurs performance - Avec bouton test */}
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              {/* Bouton toggle pour Daily Metrics Test */}
              <button
                onClick={() => setShowDailyMetricsTest(!showDailyMetricsTest)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  showDailyMetricsTest 
                    ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showDailyMetricsTest ? 'Masquer' : 'Test'} Daily Metrics
              </button>
              
              {cached && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs">Cache</span>
                </div>
              )}
              <span className="text-xs">{queryTime}ms</span>
              <span className="text-xs">{filteredCount} produits</span>
              {hasActiveFilters && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Filtres actifs
                </span>
              )}
            </div>
          </div>

          {/* SECTION TEST DAILY METRICS - Conditionnelle */}
          {showDailyMetricsTest && (
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-200/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h2 className="text-sm font-medium text-purple-900">
                    Mode Développement - Test API Daily Metrics
                  </h2>
                </div>
                <button
                  onClick={() => setShowDailyMetricsTest(false)}
                  className="text-purple-600 hover:text-purple-800 text-xs"
                >
                  ✕ Fermer
                </button>
              </div>
              
              <DailyMetricsTest />
            </div>
          )}

          {/* SECTION KPI - Avec vraies dates du store */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
            <KpisSection
              dateRange={analysisDateRange}
              comparisonDateRange={comparisonDateRange}
              filters={filters}
              includeComparison={hasComparison}
              onRefresh={handleGlobalRefresh}
              className="border-0 bg-transparent"
            />
          </div>

          {/* Tableau produits principal */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Analyse Détaillée des Produits
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Vue complète des performances par produit avec indicateurs métier
              </p>
            </div>
            
            <ProductsTable 
              products={products}
              isLoading={isLoading}
              error={error}
              onRefresh={refetch}
              className="w-full"
            />
          </div>

          {/* Message si aucune donnée */}
          {!isLoading && products.length === 0 && !error && (
            <Card variant="elevated" className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">📊</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Aucune donnée disponible
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {hasActiveFilters 
                  ? 'Aucun produit ne correspond aux filtres sélectionnés.'
                  : 'Aucun produit trouvé pour cette période.'
                }
              </p>
              <div className="text-xs text-gray-500">
                {hasActiveFilters 
                  ? 'Ajustez vos filtres pour voir plus de données'
                  : 'Vérifiez la période sélectionnée dans les filtres'
                }
              </div>
            </Card>
          )}
          
        </div>
      </main>
    </div>
  );
}