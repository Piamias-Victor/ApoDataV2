// src/app/price/page.tsx
'use client';

import React, { useMemo } from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { PriceEvolutionChart } from '@/components/organisms/PriceEvolutionChart/PriceEvolutionChart';
import { useFiltersStore } from '@/stores/useFiltersStore';

/**
 * Price Page - Analyse des prix et marges pharmaceutiques
 * 
 * Features :
 * - Header dashboard avec filtres intégrés
 * - Graphique évolution prix mensuels
 * - Background animé cohérent
 * - Integration avec store filtres global
 */
export default function PricePage(): JSX.Element {
  // Récupération des filtres du store global
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fusion des codes produits : products + laboratories + categories (même logique que dashboard)
  const allProductCodes = useMemo(() => {
    const codes = Array.from(new Set([
      ...productsFilter,
      ...laboratoriesFilter,
      ...categoriesFilter
    ]));
    
    console.log('🔄 [PricePage] Merged product codes:', {
      totalCodes: codes.length,
      fromProducts: productsFilter.length,
      fromLaboratories: laboratoriesFilter.length,
      fromCategories: categoriesFilter.length
    });
    
    return codes;
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);

  // Construction des filtres pour le composant
  const chartFilters = {
    productCodes: allProductCodes,  // Utilise les codes fusionnés
    ...(pharmacyFilter.length > 0 && { pharmacyId: pharmacyFilter[0] })
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-8 space-y-6">
          
          {/* Section titre avec indicateurs filtres */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analyse des Prix
              </h1>
              <p className="text-gray-600 mt-1">
                Évolution mensuelle des prix de vente, prix d'achat et marges
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

          {/* Graphique principal */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <PriceEvolutionChart
                dateRange={analysisDateRange}
                filters={chartFilters}
                className="w-full"
            />
          </div>
          
        </div>
      </main>
    </div>
  );
}