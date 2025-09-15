// src/components/molecules/DualKpiCard/DualKpiCard.tsx

'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/atoms/Card/Card';
import { KpiCardSkeleton } from '@/components/molecules/KpiCard/KpiCardSkeleton';
import type { DualKpiCardProps } from './types';
import { 
  formatKpiValue, 
  formatEvolutionPercentage, 
  getTrendIcon 
} from '../KpiCard/utils';

/**
 * DualKpiCard - Design repensé compact et fluide avec icônes
 * 
 * Nouveau design :
 * - Tailles réduites et plus lisibles
 * - Espacement optimisé
 * - Typographie hiérarchisée
 * - Style moderne et aéré
 * - Icônes intégrées dans le header
 */
export const DualKpiCard: React.FC<DualKpiCardProps> = ({
  mainKpi,
  secondaryKpi,
  loading = false,
  error = null,
  className = ''
}) => {
  // Loading state
  if (loading) {
    return <KpiCardSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return (
      <Card 
        variant="outlined" 
        padding="md"
        className={`border-red-200 bg-red-50 ${className}`}
      >
        <div className="text-center py-4">
          <div className="text-xs text-red-600 mb-1">Erreur</div>
          <div className="text-xs text-red-700 font-medium truncate">
            {mainKpi.title} / {secondaryKpi.title}
          </div>
        </div>
      </Card>
    );
  }

  // Memoized values pour performance
  const mainFormattedValue = useMemo(() => 
    formatKpiValue(mainKpi.value, mainKpi.unit), 
    [mainKpi.value, mainKpi.unit]
  );
  
  const secondaryFormattedValue = useMemo(() => 
    formatKpiValue(secondaryKpi.value, secondaryKpi.unit), 
    [secondaryKpi.value, secondaryKpi.unit]
  );
  
  const mainEvolution = useMemo(() => {
    if (!mainKpi.comparison) return null;
    
    const { percentage, trend } = mainKpi.comparison;
    const icon = getTrendIcon(trend);
    const formattedPercentage = formatEvolutionPercentage(percentage);
    
    return { icon, formattedPercentage, trend };
  }, [mainKpi.comparison]);

  const secondaryEvolution = useMemo(() => {
    if (!secondaryKpi.comparison) return null;
    
    const { percentage, trend } = secondaryKpi.comparison;
    const icon = getTrendIcon(trend);
    const formattedPercentage = formatEvolutionPercentage(percentage);
    
    return { icon, formattedPercentage, trend };
  }, [secondaryKpi.comparison]);

  // Couleurs d'évolution
  const getEvolutionColorClass = (evolution: typeof mainEvolution) => {
    if (!evolution) return 'text-gray-400';
    
    switch (evolution.trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-500';
      case 'neutral':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card 
      variant="elevated" 
      padding="md"
      className={`transition-all duration-200 hover:shadow-md border-gray-200 bg-white ${className}`}
    >
      {/* Header compact avec icônes */}
      <div className="mb-3 flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {mainKpi.icon && (
            <div className="flex-shrink-0">
              {mainKpi.icon}
            </div>
          )}
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide truncate">
            {mainKpi.title}
          </h3>
        </div>
        <span className="text-xs text-gray-400">/</span>
        <div className="flex items-center space-x-1">
          {secondaryKpi.icon && (
            <div className="flex-shrink-0">
              {secondaryKpi.icon}
            </div>
          )}
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide truncate">
            {secondaryKpi.title}
          </h3>
        </div>
      </div>
      
      {/* KPI Principal - Design compact */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-lg font-semibold text-gray-900 leading-none">
            {mainFormattedValue}
          </div>
          
          {/* Évolution KPI principal - inline */}
          {mainEvolution && (
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-xs">
                {mainEvolution.icon}
              </span>
              <span className={`font-medium ${getEvolutionColorClass(mainEvolution)}`}>
                {mainEvolution.formattedPercentage}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {mainKpi.title}
        </div>
      </div>
      
      {/* Divider subtil */}
      <div className="border-t border-gray-100 my-2"></div>
      
      {/* KPI Secondaire - Design compact */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-base font-medium text-gray-700 leading-none">
            {secondaryFormattedValue}
          </div>
          
          {/* Évolution KPI secondaire - inline */}
          {secondaryEvolution && (
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-xs">
                {secondaryEvolution.icon}
              </span>
              <span className={`font-medium ${getEvolutionColorClass(secondaryEvolution)}`}>
                {secondaryEvolution.formattedPercentage}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {secondaryKpi.title}
        </div>
      </div>
    </Card>
  );
};

// Performance optimization
export const MemoizedDualKpiCard = React.memo(DualKpiCard);