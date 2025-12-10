// src/components/molecules/KpiCard/KpiCardSkeleton.tsx

import React from 'react';
import { Card } from '@/components/atoms/Card/Card';
import type { KpiCardSkeletonProps } from './types';

/**
 * KpiCardSkeleton - Loading state pour KpiCard
 * Design cohérent ProductsTable skeleton patterns
 */
export const KpiCardSkeleton: React.FC<KpiCardSkeletonProps> = ({ 
  className = '' 
}) => {
  return (
    <Card 
      variant="elevated" 
      padding="lg"
      className={`animate-pulse ${className}`}
    >
      {/* Header avec titre */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
      
      {/* Valeur principale */}
      <div className="mb-3">
        <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
      </div>
      
      {/* Évolution */}
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-200 rounded w-4"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </Card>
  );
};