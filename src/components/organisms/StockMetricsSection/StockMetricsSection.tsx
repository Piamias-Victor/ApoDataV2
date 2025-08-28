// src/components/organisms/StockMetricsSection/StockMetricsSection.tsx

'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw, Package, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useStockMetrics } from '@/hooks/dashboard/useStockMetrics';
import { Button } from '@/components/atoms/Button/Button';
import { MemoizedKpiCard as KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';

interface StockMetricsSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null } | undefined;
  readonly filters?: {
    products?: string[];
    laboratories?: string[];
    categories?: string[];
    pharmacies?: string[];
  };
  readonly includeComparison?: boolean;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

interface StockKpiCard {
  readonly title: string;
  readonly value: number;  // Changed from 'number | null' to 'number'
  readonly unit: 'currency' | 'number' | 'days';
  readonly comparison?: {
    readonly value: number;
    readonly percentage: number;
    readonly trend: 'up' | 'down' | 'neutral';
  } | undefined;
  readonly variant?: 'primary' | 'secondary' | 'success' | 'warning';
  readonly subtitle?: string;
  readonly icon?: React.ReactNode;
}

/**
 * StockMetricsSection - Organism pour métriques de stock pharmaceutiques
 * 
 * Features complètes :
 * - 4 KPI cards : Quantité stock, Valeur stock, Stock moyen 12M, Jours de stock
 * - Grille responsive 2x2 ou 4 colonnes
 * - Hook useStockMetrics intégration directe
 * - États loading/error/empty cohérents avec KpisSection
 * - Refresh manuel avec indicateur visuel
 * - Performance optimisée React.memo + useMemo
 * - Filtres identiques aux autres sections
 */
export const StockMetricsSection: React.FC<StockMetricsSectionProps> = ({
  dateRange,
  comparisonDateRange,
  filters = {},
  includeComparison = false,
  onRefresh,
  className = ''
}) => {
  // Hook Stock metrics avec mêmes filtres que ProductsTable/KpisSection
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    hasData 
  } = useStockMetrics({
    enabled: true,
    includeComparison,
    dateRange: dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined,
    filters
  });

  // Transformation données en KPI Cards avec calcul comparaisons
  const stockKpis = useMemo((): StockKpiCard[] | null => {
    if (!data) return null;

    const formatComparison = (current: number | null, comparison: number | null | undefined) => {
      if (current === null || comparison === null || comparison === undefined || comparison === 0) return undefined;
      
      const percentageChange = ((current - comparison) / comparison) * 100;
      const trend: 'up' | 'down' | 'neutral' = 
        percentageChange > 2 ? 'up' : 
        percentageChange < -2 ? 'down' : 'neutral';

      return {
        value: percentageChange,
        percentage: percentageChange,
        trend
      };
    };

    return [
      {
        title: 'Quantité Stock Actuel',
        value: data.quantite_stock_actuel_total || 0,  // Ensure number, not null
        unit: 'number' as const,
        comparison: formatComparison(
          data.quantite_stock_actuel_total, 
          data.comparison?.quantite_stock_actuel_total ?? null
        ),
        variant: (data.quantite_stock_actuel_total > 0 ? 'primary' : 'warning'),
        subtitle: `${data.nb_references_produits} références`,
        icon: <Package className="w-5 h-5" />
      },
      {
        title: 'Valeur Stock Actuel',
        value: data.montant_stock_actuel_total || 0,  // Ensure number, not null
        unit: 'currency' as const,
        comparison: formatComparison(
          data.montant_stock_actuel_total, 
          data.comparison?.montant_stock_actuel_total ?? null
        ),
        variant: (data.montant_stock_actuel_total > 0 ? 'success' : 'warning'),
        subtitle: `${data.nb_pharmacies} pharmacie${data.nb_pharmacies > 1 ? 's' : ''}`,
        icon: <BarChart3 className="w-5 h-5" />
      },
      {
        title: 'Stock Moyen 12 Mois',
        value: data.stock_moyen_12_mois || 0,  // Ensure number, not null
        unit: 'number' as const,
        comparison: formatComparison(
          data.stock_moyen_12_mois, 
          data.comparison?.stock_moyen_12_mois ?? null
        ),
        variant: 'secondary',
        subtitle: 'Moyenne historique',
        icon: <TrendingUp className="w-5 h-5" />
      },
      {
        title: 'Jours de Stock',
        value: data.jours_de_stock_actuels || 0,  // Ensure number, not null
        unit: 'days' as const,
        comparison: formatComparison(
          data.jours_de_stock_actuels, 
          data.comparison?.jours_de_stock_actuels ?? null
        ),
        variant: data.jours_de_stock_actuels === null ? 'warning' :
                data.jours_de_stock_actuels > 90 ? 'warning' :
                data.jours_de_stock_actuels > 30 ? 'primary' : 'success',
        subtitle: data.jours_de_stock_actuels === null ? 
          'Calcul impossible' : 
          data.jours_de_stock_actuels > 90 ? 'Stock élevé' :
          data.jours_de_stock_actuels > 30 ? 'Stock normal' : 'Stock faible',
        icon: <Calendar className="w-5 h-5" />
      }
    ];
  }, [data]);

  // Handler refresh avec callback externe
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Message d'erreur contextuel
  const errorMessage = useMemo(() => {
    if (!error) return null;
    
    if (error.includes('Date range')) {
      return 'Veuillez sélectionner une plage de dates valide dans les filtres.';
    }
    
    if (error.includes('timeout') || error.includes('network')) {
      return 'Problème de connexion. Vérifiez votre réseau et réessayez.';
    }
    
    return 'Une erreur est survenue lors du calcul des métriques de stock. Réessayez dans quelques instants.';
  }, [error]);

  // État empty avec données insignifiantes
  const isEmpty = useMemo(() => {
    return hasData && data && (
      data.quantite_stock_actuel_total === 0 &&
      data.montant_stock_actuel_total === 0 &&
      data.stock_moyen_12_mois === 0 &&
      data.nb_references_produits === 0
    );
  }, [hasData, data]);

  // Rendu états d'erreur
  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Métriques de Stock
          </h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement des métriques de stock
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
            Métriques de Stock
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de votre inventaire et rotation des stocks
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
      

      {/* Grille Stock KPI responsive - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* État Loading : 4 skeletons */}
        {isLoading && (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        )}
        
        {/* État Success : Stock KPI cards avec validation complète */}
        {!isLoading && stockKpis && (
          <>
            {stockKpis.map((kpi, index) => (
              <KpiCard
                key={`stock-kpi-${index}`}
                title={kpi.title}
                value={kpi.value}
                unit={kpi.unit}
                comparison={kpi.comparison}
                variant={kpi.variant}
                subtitle={kpi.subtitle}
                icon={kpi.icon}
              />
            ))}
          </>
        )}
        
        {/* État Empty : message si pas de données significatives */}
        {!isLoading && isEmpty && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée de stock disponible
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Aucun stock détecté sur la période sélectionnée. 
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
        {!isLoading && !stockKpis && !isEmpty && (
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
              Les données de stock ne sont pas complètes pour l'affichage.
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
export const MemoizedStockMetricsSection = React.memo(StockMetricsSection);