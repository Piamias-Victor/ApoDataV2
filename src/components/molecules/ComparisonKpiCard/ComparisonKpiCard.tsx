// src/components/molecules/ComparisonKpiCard/ComparisonKpiCard.tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Trophy } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

interface ComparisonKpiCardProps {
  readonly title: string;
  readonly unit: 'currency' | 'percentage' | 'number' | 'days';
  readonly valueA: number;
  readonly valueB: number;
  readonly elementAName: string;
  readonly elementBName: string;
  readonly loading?: boolean;
  readonly className?: string;
}

/**
 * ComparisonKpiCard - Design intuitif Apple/Stripe inspiré
 * 
 * Améliorations UX :
 * - Layout côte à côte plus visuel
 * - Indicateur de winner avec icône
 * - Barres de progression relatives
 * - Couleurs sémantiques intuitives
 * - Animations micro-interactives
 * - Meilleure hiérarchie visuelle
 */
export const ComparisonKpiCard: React.FC<ComparisonKpiCardProps> = ({
  title,
  unit,
  valueA,
  valueB,
  elementAName,
  elementBName,
  loading = false,
  className = ''
}) => {
  // Format des valeurs selon l'unité
  const formatValue = (value: number): string => {
    if (value === 0) return unit === 'currency' ? '0 €' : '0';
    
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          notation: value >= 1000000 ? 'compact' : 'standard',
          compactDisplay: 'short'
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      case 'number':
        return new Intl.NumberFormat('fr-FR', {
          maximumFractionDigits: 0,
          notation: value >= 10000 ? 'compact' : 'standard',
          compactDisplay: 'short'
        }).format(value);
      
      case 'days':
        return value ? `${Math.round(value)} j` : '0 j';
      
      default:
        return value.toString();
    }
  };

  // Calcul différence et gagnant
  const difference = valueB - valueA;
  const percentageDifference = valueA !== 0 ? Math.abs(difference) / Math.abs(valueA) * 100 : 0;
  const winner = valueB > valueA ? 'B' : valueA > valueB ? 'A' : 'tie';
  const hasSignificantDifference = percentageDifference >= 5; // Seuil 5% pour affichage winner
  
  // Calcul des barres de progression relatives
  const maxValue = Math.max(Math.abs(valueA), Math.abs(valueB));
  const progressA = maxValue > 0 ? (Math.abs(valueA) / maxValue) * 100 : 0;
  const progressB = maxValue > 0 ? (Math.abs(valueB) / maxValue) * 100 : 0;

  const getTrendIcon = () => {
    if (!hasSignificantDifference) return <Minus className="w-3.5 h-3.5" />;
    return difference > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />;
  };

  const getTrendColor = () => {
    if (!hasSignificantDifference) return 'text-gray-400';
    return difference > 0 ? 'text-emerald-600' : 'text-red-500';
  };

  const formatDifference = () => {
    const formattedAbsolute = formatValue(Math.abs(difference));
    const sign = difference >= 0 ? '+' : '-';
    return `${sign}${formattedAbsolute}`;
  };

  // Loading state
  if (loading) {
    return (
      <Card variant="outlined" padding="md" className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      variant="elevated" 
      padding="lg"
      className={`transition-all duration-300 hover:shadow-lg border-gray-200 bg-white group ${className}`}
    >
      {/* Header avec titre et indicateur winner */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {title}
          </h3>
          {hasSignificantDifference && (
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                winner === 'A' ? 'bg-blue-100 text-blue-700' : 
                winner === 'B' ? 'bg-purple-100 text-purple-700' : 
                'bg-gray-100 text-gray-600'
              }`}>
                {winner === 'A' ? 'A' : winner === 'B' ? 'B' : '='}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparaison côte à côte avec barres de progression */}
      <div className="space-y-4 mb-6">
        
        {/* Élément A */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                winner === 'A' && hasSignificantDifference ? 'bg-blue-500' : 'bg-blue-300'
              }`}></div>
              <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]" title={elementAName}>
                {elementAName}
              </span>
            </div>
            <span className={`text-lg font-bold ${
              winner === 'A' && hasSignificantDifference ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {formatValue(valueA)}
            </span>
          </div>
          
          {/* Barre de progression A */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out ${
                winner === 'A' && hasSignificantDifference ? 'bg-blue-500' : 'bg-blue-300'
              }`}
              style={{ width: `${progressA}%` }}
            ></div>
          </div>
        </div>

        {/* Flèche séparatrice */}
        <div className="flex justify-center">
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </div>

        {/* Élément B */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                winner === 'B' && hasSignificantDifference ? 'bg-purple-500' : 'bg-purple-300'
              }`}></div>
              <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]" title={elementBName}>
                {elementBName}
              </span>
            </div>
            <span className={`text-lg font-bold ${
              winner === 'B' && hasSignificantDifference ? 'text-purple-700' : 'text-gray-900'
            }`}>
              {formatValue(valueB)}
            </span>
          </div>
          
          {/* Barre de progression B */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out delay-100 ${
                winner === 'B' && hasSignificantDifference ? 'bg-purple-500' : 'bg-purple-300'
              }`}
              style={{ width: `${progressB}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer avec différence */}
      <div className="text-center pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2">
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-semibold">
              {formatDifference()}
            </span>
          </div>
          
          {hasSignificantDifference && (
            <>
              <span className="text-gray-300">•</span>
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {percentageDifference.toFixed(0)}% d'écart
              </span>
            </>
          )}
        </div>
        
        {!hasSignificantDifference && (
          <p className="text-xs text-gray-400 mt-1">
            Valeurs similaires
          </p>
        )}
      </div>
    </Card>
  );
};