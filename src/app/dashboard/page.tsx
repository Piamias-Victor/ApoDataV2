// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ProductsTable } from '@/components/organisms/ProductsTable/ProductsTable';
import { MemoizedKpisSection as KpisSection } from '@/components/organisms/KpisSection/KpisSection';
import { useProductsList } from '@/hooks/products/useProductsList';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { Card } from '@/components/atoms/Card/Card';

/**
 * Dashboard Page - Avec filtres depuis Zustand store
 * 
 * CORRECTION MAJEURE :
 * - Utilise useFiltersStore comme useProductsList
 * - Plus d'états locaux inutilisés
 * - Même source de vérité pour KPI et ProductsTable
 * - Synchronisation automatique
 */
export default function DashboardPage(): JSX.Element {
  // Récupération des filtres depuis le store Zustand (même source que useProductsList)
  const dateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Comparaison avec période précédente (fixe pour l'instant)
  const comparisonDateRange = {
    start: '2023-01-01T00:00:00Z',
    end: '2023-12-31T23:59:59Z'
  };

  // Filtres formatés pour les hooks KPI (même format que useProductsList)
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
            
            {/* Indicateurs performance - Avec filtres actifs */}
            <div className="flex items-center space-x-3 text-sm text-gray-500">
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

          {/* SECTION KPI - Avec vrais filtres Zustand */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
            <KpisSection
              dateRange={dateRange}
              comparisonDateRange={comparisonDateRange}
              filters={filters}
              includeComparison={true}
              onRefresh={handleGlobalRefresh}
              className="border-0 bg-transparent"
            />
            
            {/* Debug info filtres appliqués */}
            {process.env.NODE_ENV === 'development' && (
              <div className="px-6 pb-4">
                <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-md">
                  Filtres KPI: {productsFilter.length} produits, {laboratoriesFilter.length} labos, {categoriesFilter.length} catégories, {pharmacyFilter.length} pharmacies
                  <br />
                  Période: {dateRange.start.split('T')[0]} → {dateRange.end.split('T')[0]}
                  {hasActiveFilters && ' | Filtrage actif'}
                </div>
              </div>
            )}
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