// src/components/organisms/PriceEvolutionKpis/PriceEvolutionKpis.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { usePriceEvolution } from '@/hooks/price/usePriceEvolution';
import { Button } from '@/components/atoms/Button/Button';
import { MemoizedKpiCard as KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import type { KpiComparison, TrendDirection } from '@/components/molecules/KpiCard/types';

interface PriceEvolutionKpisProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

/**
 * PriceEvolutionKpis - Organism évolutions prix pharmaceutiques
 * 
 * Features :
 * - 4 KPI cards évolutions prix/marges
 * - Grille responsive 2x2 ou 4x1
 * - Hook usePriceEvolution intégration directe
 * - États loading/error cohérents ApoData
 * - Design compact et lisible
 * - Couleurs évolutions (vert hausse, rouge baisse)
 * - Type safety pour valeurs numériques
 */
export const PriceEvolutionKpis: React.FC<PriceEvolutionKpisProps> = ({
  className = '',
  onRefresh
}) => {
  
  // Hook évolutions prix avec filtres store Zustand
  const { 
    metrics, 
    isLoading, 
    error, 
    refetch,
    hasData 
  } = usePriceEvolution({
    enabled: true
  });

  // Handler refresh avec callback externe
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Transformation métrique en KPI card avec couleurs évolutions + type safety
  const kpiCards = useMemo(() => {
    if (!metrics) return null;

    // Fonction utilitaire pour conversion sécurisée en number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const getTrendFromEvolution = (evolutionPct: any): TrendDirection => {
      const numValue = safeNumber(evolutionPct);
      if (numValue > 0.5) return 'up';
      if (numValue < -0.5) return 'down';
      return 'neutral';
    };

    const getComparisonFromEvolution = (evolutionPct: any): KpiComparison => {
      const numValue = safeNumber(evolutionPct);
      return {
        value: Math.abs(numValue),
        percentage: numValue,
        trend: getTrendFromEvolution(numValue)
      };
    };

    // Conversion sécurisée des métriques
    const safeMetrics = {
      evolution_prix_vente_pct: safeNumber(metrics.evolution_prix_vente_pct),
      evolution_prix_achat_pct: safeNumber(metrics.evolution_prix_achat_pct),
      evolution_marge_pct: safeNumber(metrics.evolution_marge_pct),
      ecart_prix_vs_marche_pct: safeNumber(metrics.ecart_prix_vs_marche_pct),
      nb_produits_analyses: safeNumber(metrics.nb_produits_analyses)
    };

    return [
      {
        title: 'Évolution Prix Vente',
        value: safeMetrics.evolution_prix_vente_pct, // Garder le signe
        unit: 'percentage' as const,
        subtitle: 'Début → fin période'
      },
      {
        title: 'Évolution Prix Achat', 
        value: safeMetrics.evolution_prix_achat_pct, // Garder le signe
        unit: 'percentage' as const,
        subtitle: 'Début → fin période'
      },
      {
        title: 'Évolution Marge %',
        value: safeMetrics.evolution_marge_pct, // Garder le signe
        unit: 'percentage' as const,
        subtitle: 'Différence absolue'
      },
      {
        title: 'Écart vs Marché',
        value: safeMetrics.ecart_prix_vs_marche_pct, // Garder le signe
        unit: 'percentage' as const,
        subtitle: 'Position concurrentielle'
      }
    ];
  }, [metrics]);

  // Rendu états d'erreur
  if (error) {
    return (
      <section className={`px-6 py-6 ${className}`}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Évolutions des Prix
          </h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur calcul évolutions
          </h3>
          
          <p className="text-red-700 mb-4 max-w-md">
            {error}
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
            Évolutions des Prix
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {hasData && metrics 
              ? `Analyse sur ${Number(metrics.nb_produits_analyses) || 0} produits`
              : 'Évolutions tarifaires et positionnement marché'
            }
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
      

      {/* Grille KPI responsive - 4 cards */}
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
        
        {/* État Success : KPI cards évolutions */}
        {!isLoading && kpiCards && kpiCards.map((kpi, index) => (
          <KpiCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            unit={kpi.unit}
            comparison={kpi.comparison}
            subtitle={kpi.subtitle}
          />
        ))}
        
        {/* État Empty : message si pas de données */}
        {!isLoading && !hasData && !error && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune évolution calculable
            </h3>
            
            <p className="text-gray-500 mb-4 max-w-md">
              Données insuffisantes pour calculer les évolutions. 
              Vérifiez la période sélectionnée (minimum 7 jours) et les filtres.
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
      </div>
    </section>
  );
};

// Performance optimization avec React.memo
export const MemoizedPriceEvolutionKpis = React.memo(PriceEvolutionKpis);