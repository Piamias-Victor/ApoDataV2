// src/components/molecules/ComparisonKpiCard/ComparisonKpiCard.tsx
'use client';

import React from 'react';
import { TrendingUp, Minus, Trophy } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

// src/components/molecules/ComparisonKpiCard/ComparisonKpiCard.tsx
// src/components/molecules/ComparisonKpiCard/ComparisonKpiCard.tsx

interface ComparisonKpiCardProps {
  readonly title: string;
  readonly unit: 'currency' | 'percentage' | 'number' | 'days';
  readonly valueA: number;
  readonly valueB: number;
  readonly valueC?: number | undefined;  // ← Explicit undefined
  readonly elementAName?: string | undefined;  // ← Explicit undefined
  readonly elementBName?: string | undefined;  // ← Explicit undefined 
  readonly elementCName?: string | undefined;  // ← Explicit undefined
  readonly loading?: boolean;
  readonly className?: string;
}

/**
 * ComparisonKpiCard - Design intuitif Apple/Stripe pour 2-3 éléments
 * 
 * Améliorations UX :
 * - Layout adaptatif pour 2 ou 3 éléments
 * - Indicateur de winner avec icône
 * - Barres de progression relatives
 * - Couleurs sémantiques A=bleu, B=violet, C=vert
 * - Animations micro-interactives
 * - Meilleure hiérarchie visuelle
 */
export const ComparisonKpiCard: React.FC<ComparisonKpiCardProps> = ({
  title,
  unit,
  valueA,
  valueB,
  valueC,
  elementAName,
  elementBName,
  elementCName,
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

  // Éléments actifs (non nulls)
  const elements = [
    { value: valueA, name: elementAName, key: 'A', color: 'blue' },
    { value: valueB, name: elementBName, key: 'B', color: 'purple' },
    ...(valueC !== undefined && elementCName ? [{ value: valueC, name: elementCName, key: 'C', color: 'green' }] : [])
  ];

  // Calcul du gagnant et statistiques
  const maxValue = Math.max(...elements.map(e => Math.abs(e.value)));
  const winner = elements.find(e => Math.abs(e.value) === maxValue);
  const minValue = Math.min(...elements.map(e => Math.abs(e.value)));
  const range = maxValue - minValue;
  const hasSignificantDifference = maxValue > 0 && (range / maxValue) >= 0.05; // Seuil 5%

  // Couleurs par élément
  const getElementColors = (key: string, isWinner: boolean) => {
    const baseColors = {
      A: { 
        dot: isWinner ? 'bg-blue-500' : 'bg-blue-300',
        text: isWinner ? 'text-blue-700' : 'text-gray-900',
        bar: isWinner ? 'bg-blue-500' : 'bg-blue-300',
        badge: 'bg-blue-100 text-blue-700'
      },
      B: { 
        dot: isWinner ? 'bg-purple-500' : 'bg-purple-300',
        text: isWinner ? 'text-purple-700' : 'text-gray-900',
        bar: isWinner ? 'bg-purple-500' : 'bg-purple-300',
        badge: 'bg-purple-100 text-purple-700'
      },
      C: { 
        dot: isWinner ? 'bg-green-500' : 'bg-green-300',
        text: isWinner ? 'text-green-700' : 'text-gray-900',
        bar: isWinner ? 'bg-green-500' : 'bg-green-300',
        badge: 'bg-green-100 text-green-700'
      }
    };
    return baseColors[key as keyof typeof baseColors];
  };

  // Calcul des barres de progression relatives
  const getProgressWidth = (value: number) => {
    return maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
  };

  // Loading state
  if (loading) {
    return (
      <Card variant="outlined" padding="md" className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          <div className="space-y-3">
            {Array.from({ length: elements.length }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
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
          {hasSignificantDifference && winner && (
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                getElementColors(winner.key, true).badge
              }`}>
                {winner.key}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparaison éléments avec barres de progression */}
      <div className={`space-y-3 mb-6`}>
        {elements.map((element, index) => {
          const isWinner = hasSignificantDifference && winner?.key === element.key;
          const colors = getElementColors(element.key, isWinner);
          const progressWidth = getProgressWidth(element.value);

          return (
            <div key={element.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                  <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]" title={element.name}>
                    {element.name || `Élément ${element.key}`}
                  </span>
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>
                  {formatValue(element.value)}
                </span>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${colors.bar}`}
                  style={{ 
                    width: `${progressWidth}%`,
                    transitionDelay: `${index * 100}ms`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer avec statistiques */}
      <div className="text-center pt-4 border-t border-gray-100">
        {hasSignificantDifference ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-1 text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">
                  {formatValue(range)} d'écart
                </span>
              </div>
              
              <span className="text-gray-300">•</span>
              <span className="text-sm font-medium text-emerald-600">
                {((range / maxValue) * 100).toFixed(0)}% de variation
              </span>
            </div>
            
            <p className="text-xs text-gray-500">
              {winner?.name || `Élément ${winner?.key}`} en tête
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-1 text-gray-400">
              <Minus className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">
                Valeurs similaires
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};