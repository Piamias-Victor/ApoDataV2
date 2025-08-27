// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ProductsTable } from '@/components/organisms/ProductsTable/ProductsTable';
import { useProductsList } from '@/hooks/products/useProductsList';
import { Card } from '@/components/atoms/Card/Card';
import KpiTestComponent from '../test-kpi/page';

/**
 * Dashboard Page - Page principale avec tableau produits
 * 
 * Layout avec header dashboard + filterbar, background animé
 * Intégration ProductsTable avec hook useProductsList
 * Padding ajusté pour header (64px) + filterbar (52px) = 116px
 */
export default function DashboardPage(): JSX.Element {
  // Hook existant pour récupérer les données produits
  const { 
    products, 
    isLoading, 
    error,
    queryTime,
    cached,
    refetch
  } = useProductsList();

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-8 space-y-6">
          
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
              </div>
            )}
          </div>

          {/* Tableau produits principal */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
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
              <div className="text-sm text-gray-500">
                💡 Vérifiez que les filtres de dates et produits sont correctement configurés
              </div>
            </Card>
          )}
          
        </div>
        <KpiTestComponent/>
      </main>
    </div>
  );
}