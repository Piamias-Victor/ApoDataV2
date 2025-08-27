// src/components/molecules/KpiCard/KpiCard.tsx

'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/atoms/Card/Card';
import { KpiCardSkeleton } from './KpiCardSkeleton';
import type { KpiCardProps } from './types';
import { 
  formatKpiValue, 
  formatEvolutionPercentage, 
  getTrendIcon 
} from './utils';

/**
 * KpiCard - Design repensé compact et moderne
 * 
 * Nouveau design :
 * - Taille réduite et lisible
 * - Typographie hiérarchisée
 * - Espacement optimisé
 * - Style aéré et moderne
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  comparison,
  loading = false,
  error = null,
  subtitle,
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
          <div className="text-xs text-red-700 font-medium">{title}</div>
        </div>
      </Card>
    );
  }

  // Memoized values pour performance
  const formattedValue = useMemo(() => formatKpiValue(value, unit), [value, unit]);
  
  const evolutionDisplay = useMemo(() => {
    if (!comparison) return null;
    
    const { percentage, trend } = comparison;
    const icon = getTrendIcon(trend);
    const formattedPercentage = formatEvolutionPercentage(percentage);
    
    return { icon, formattedPercentage, trend };
  }, [comparison]);

  // Couleurs d'évolution
  const evolutionColorClass = useMemo(() => {
    if (!evolutionDisplay) return 'text-gray-400';
    
    switch (evolutionDisplay.trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-500';
      case 'neutral':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  }, [evolutionDisplay]);

  return (
    <Card 
      variant="elevated" 
      padding="md"
      className={`transition-all duration-200 hover:shadow-md border-gray-200 bg-white ${className}`}
    >
      {/* Header compact */}
      <div className="mb-3">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Valeur principale et évolution */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-lg font-semibold text-gray-900 leading-none">
          {formattedValue}
        </div>
        
        {/* Évolution inline */}
        {evolutionDisplay && (
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-xs">
              {evolutionDisplay.icon}
            </span>
            <span className={`font-medium ${evolutionColorClass}`}>
              {evolutionDisplay.formattedPercentage}
            </span>
          </div>
        )}
      </div>
      
      {/* Footer info */}
      {evolutionDisplay ? (
        <div className="text-xs text-gray-400">
          vs période précédente
        </div>
      ) : (
        <div className="text-xs text-gray-400">
          Période actuelle
        </div>
      )}
    </Card>
  );
};

// Performance optimization
export const MemoizedKpiCard = React.memo(KpiCard);