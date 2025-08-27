// src/components/organisms/KpisSection/KpisSection.tsx

'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useKpiMetrics } from '@/hooks/dashboard/useKpiMetrics';
import { Button } from '@/components/atoms/Button/Button';
import { MemoizedKpiCard as KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import { MemoizedDualKpiCard as DualKpiCard } from '@/components/molecules/DualKpiCard/DualKpiCard';
import type { KpisSectionProps } from './types';
import { transformKpiData, validateKpiData, getKpiErrorMessage, hasSignificantKpiData, groupKpisForDualCards } from './utils';

/**
 * KpisSection - Organism pour dashboard KPI pharmaceutiques
 * 
 * Features complètes :
 * - 6 KPI cards : 4 doubles + 2 simples
 * - Grille responsive 3 colonnes
 * - Hook useKpiMetrics intégration directe
 * - États loading/error/empty cohérents ProductsTable
 * - Refresh manuel avec indicateur visuel
 * - Performance optimisée React.memo + useMemo
 * - Filtres identiques ProductsTable (products, laboratories, categories, pharmacies)
 */
export const KpisSection: React.FC<KpisSectionProps> = ({
  dateRange,
  comparisonDateRange,
  filters = {},
  includeComparison = false,
  onRefresh,
  className = ''
}) => {
  // Hook KPI avec mêmes filtres que ProductsTable - UTILISE ANALYSIS ET COMPARISON
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    hasData 
  } = useKpiMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange, // Période principale (analysisDateRange du store)
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined, // Période précédente
    filters
  });

  // Validation et transformation données
  const transformedKpis = useMemo(() => {
    if (!data || !validateKpiData(data)) return null;
    return transformKpiData(data);
  }, [data]);

  // Regroupement pour cards doubles avec validation TypeScript
  const groupedKpis = useMemo(() => {
    if (!transformedKpis || transformedKpis.length < 10) return null;
    try {
      return groupKpisForDualCards(transformedKpis);
    } catch (error) {
      console.error('Error grouping KPIs:', error);
      return null;
    }
  }, [transformedKpis]);

  // Handler refresh avec callback externe
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Message d'erreur contextuel
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return getKpiErrorMessage(error);
  }, [error]);

  // État empty avec données insignifiantes
  const isEmpty = useMemo(() => {
    return hasData && data && !hasSignificantKpiData(data);
  }, [hasData, data]);

  // Rendu états d'erreur
  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Indicateurs Clés
          </h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement des KPI
          </h3>
          
          <p className="text-red-700 mb-4 max-w-md">
            {errorMessage}
          </p>
          
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Réessayer
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-6 py-6 ${className}`}>
      {/* Header avec titre et bouton refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Indicateurs Clés
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de vos performances pharmaceutiques
          </p>
        </div>
        
        {/* Bouton refresh */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          iconLeft={
            <RotateCcw 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            />
          }
          className="text-gray-600 hover:text-gray-900"
        >
          {isLoading ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>
      

      {/* Grille KPI responsive - 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        
        {/* État Loading : 6 skeletons */}
        {isLoading && (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        )}
        
        {/* État Success : KPI cards avec validation complète */}
        {!isLoading && groupedKpis && (
          <>
            {/* Card 1: CA TTC / Quantités vendues */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.caSales.main.title,
                value: groupedKpis.caSales.main.value,
                unit: groupedKpis.caSales.main.unit,
                comparison: groupedKpis.caSales.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.caSales.secondary.title,
                value: groupedKpis.caSales.secondary.value,
                unit: groupedKpis.caSales.secondary.unit,
                comparison: groupedKpis.caSales.secondary.comparison
              }}
            />
            
            {/* Card 2: Achat HT / Quantités achetées */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.purchaseQuantity.main.title,
                value: groupedKpis.purchaseQuantity.main.value,
                unit: groupedKpis.purchaseQuantity.main.unit,
                comparison: groupedKpis.purchaseQuantity.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.purchaseQuantity.secondary.title,
                value: groupedKpis.purchaseQuantity.secondary.value,
                unit: groupedKpis.purchaseQuantity.secondary.unit,
                comparison: groupedKpis.purchaseQuantity.secondary.comparison
              }}
            />
            
            {/* Card 3: Marge / % Marge */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.margin.main.title,
                value: groupedKpis.margin.main.value,
                unit: groupedKpis.margin.main.unit,
                comparison: groupedKpis.margin.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.margin.secondary.title,
                value: groupedKpis.margin.secondary.value,
                unit: groupedKpis.margin.secondary.unit,
                comparison: groupedKpis.margin.secondary.comparison
              }}
            />
            
            {/* Card 4: Stock / Quantité stock */}
            <DualKpiCard
              mainKpi={{
                title: groupedKpis.stock.main.title,
                value: groupedKpis.stock.main.value,
                unit: groupedKpis.stock.main.unit,
                comparison: groupedKpis.stock.main.comparison
              }}
              secondaryKpi={{
                title: groupedKpis.stock.secondary.title,
                value: groupedKpis.stock.secondary.value,
                unit: groupedKpis.stock.secondary.unit,
                comparison: groupedKpis.stock.secondary.comparison
              }}
            />
            
            {/* Card 5: Jours de stock (simple) */}
            <KpiCard
              title={groupedKpis.stockDays.title}
              value={groupedKpis.stockDays.value}
              unit={groupedKpis.stockDays.unit}
              comparison={groupedKpis.stockDays.comparison}
              variant={groupedKpis.stockDays.variant}
              subtitle={groupedKpis.stockDays.subtitle}
            />
            
            {/* Card 6: Références (simple) */}
            <KpiCard
              title={groupedKpis.references.title}
              value={groupedKpis.references.value}
              unit={groupedKpis.references.unit}
              comparison={groupedKpis.references.comparison}
              variant={groupedKpis.references.variant}
              subtitle={groupedKpis.references.subtitle}
            />
          </>
        )}
        
        {/* État Empty : message si pas de données significatives */}
        {!isLoading && isEmpty && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Aucune activité détectée sur la période sélectionnée. 
              Vérifiez vos filtres ou changez de période.
            </p>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              Actualiser les données
            </Button>
          </div>
        )}
        
        {/* État Error dans les données transformées */}
        {!isLoading && !groupedKpis && transformedKpis && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Données incomplètes
            </h3>
            
            <p className="text-yellow-700 mb-4 max-w-md">
              Les données KPI ne sont pas complètes pour l'affichage.
              Essayez de modifier la période ou les filtres.
            </p>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              Recharger
            </Button>
          </div>
        )}
        
      </div>
    </section>
  );
};

// Performance optimization avec React.memo
export const MemoizedKpisSection = React.memo(KpisSection);