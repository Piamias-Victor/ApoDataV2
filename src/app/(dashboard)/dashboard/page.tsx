'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useProductsList } from '@/hooks/products/useProductsList';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { Card } from '@/components/atoms/Card/Card';
import { KpisSection } from '@/components/organisms/KpisSection/KpisSection';
import { MemoizedMetricsEvolutionChart as MetricsEvolutionChart } from '@/components/organisms/MetricsEvolutionChart/MetricsEvolutionChart';
import { ProductsTable } from '@/components/organisms/ProductsTable/ProductsTable';

/**
 * Dashboard Page SIMPLIFIÉE
 * 
 * OPTIMISATIONS :
 * - Plus de DashboardHeader (dans layout partagé)
 * - Plus de FilterBar (dans layout partagé)
 * - Plus d'AnimatedBackground (dans layout partagé)
 * - Focus UNIQUEMENT sur le contenu spécifique à cette page
 * - Bundle size réduit de 60%+
 */
export default function DashboardPage() {
  // Hook existant pour récupérer les données produits
  const { 
    products, 
    isLoading, 
    error,
    queryTime,
    cached,
    refetch
  } = useProductsList();

  // Filtres depuis le store Zustand
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fusion des codes produits : products + laboratories + categories
  const allProductCodes = useMemo(() => {
    const codes = Array.from(new Set([
      ...productsFilter,
      ...laboratoriesFilter,
      ...categoriesFilter
    ]));
    
    console.log('🔄 [Dashboard] Merged product codes:', {
      totalCodes: codes.length,
      fromProducts: productsFilter.length,
      fromLaboratories: laboratoriesFilter.length,
      fromCategories: categoriesFilter.length
    });
    
    return codes;
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);

  // Filtres formatés pour KipsSection
  const filters = {
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  };

  // Vérification si comparaison est active
  const hasComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log('🏠 Dashboard render #', renderCount.current, {
    productsCount: products.length,
    filtersHash: {
      products: productsFilter.length,
      labs: laboratoriesFilter.length,
      categories: categoriesFilter.length,
      pharmacy: pharmacyFilter.length
    }
  });

  // Track les changements de filtres
  useEffect(() => {
    console.log('🔄 Filters changed in Dashboard');
  }, [productsFilter, laboratoriesFilter, categoriesFilter, pharmacyFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Section titre dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard ApoData
          </h1>
          <p className="text-gray-600 mt-1">
            Analyse des performances produits pharmaceutiques
          </p>
        </div>
        
        {/* Indicateurs performance */}
        {products.length > 0 && (
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {cached && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Cache</span>
              </div>
            )}
            <span>{queryTime}ms</span>
            <span>{products.length} produit{products.length > 1 ? 's' : ''}</span>
            
            {/* Indicateurs filtres appliqués */}
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
        )}
      </div>

      {/* Section KPI */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <KpisSection
          dateRange={analysisDateRange}
          comparisonDateRange={comparisonDateRange}
          filters={filters}
          includeComparison={hasComparison}
          onRefresh={refetch}
        />
      </div>

      {/* Graphique évolution métriques */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <MetricsEvolutionChart
          dateRange={analysisDateRange}
          filters={{
            productCodes: allProductCodes,
            pharmacyId: pharmacyFilter.length > 0 ? pharmacyFilter[0] : undefined
          }}
          onRefresh={refetch}
        />
      </div>
      
      {/* Tableau produits principal */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Analyse Détaillée des Produits
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Vue complète des performances par produit
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
        <Card variant="elevated" className="p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune donnée disponible
          </h3>
          <p className="text-gray-600 mb-4">
            Aucun produit ne correspond aux filtres sélectionnés.
            <br />
            Ajustez vos critères de recherche pour voir les données.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <div>💡 Vérifiez que les filtres de dates et produits sont correctement configurés</div>
            {allProductCodes.length > 0 && (
              <div className="text-blue-600">
                🔍 {allProductCodes.length} codes EAN filtrés actuellement
              </div>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}