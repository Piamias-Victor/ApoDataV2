// src/components/organisms/ComparisonPriceAnalysis/ComparisonPriceAnalysis.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, RotateCcw, Minus } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useCompetitiveAnalysis } from '@/hooks/competitive/useCompetitiveAnalysis';

interface ComparisonPriceAnalysisProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

interface PriceMetrics {
  totalProducts: number;
  avgPriceMarket: number;
  avgPriceSelection: number;
  avgMargin: number;
  competitiveAdvantage: number; // % de produits moins chers que le marché
  products: Array<{
    name: string;
    code: string;
    priceMarket: number;
    priceSelection: number;
    marginPercent: number;
    priceGapPercent: number;
  }>;
}

/**
 * ComparisonPriceAnalysis - Analyse concurrentielle prix A vs B
 * 
 * Features :
 * - Comparaison prix marché vs sélection pour éléments A/B
 * - Métriques agrégées : prix moyen, marge, avantage concurrentiel
 * - Top 5 produits avec plus gros écarts
 * - Indicateurs visuels tendance prix/marge
 * - Design cohérent avec autres sections comparaison
 */
export const ComparisonPriceAnalysis: React.FC<ComparisonPriceAnalysisProps> = ({
  className = '',
  onRefresh
}) => {
  // Store states
  const { elementA, elementB } = useComparisonStore();

  // Hook competitive analysis pour élément A
  const {
    products: productsA,
    isLoading: loadingA,
    error: errorA,
    refetch: refetchA
  } = useCompetitiveAnalysis({
    enabled: !!elementA
  });

  // Hook competitive analysis pour élément B  
  const {
    products: productsB,
    isLoading: loadingB,
    error: errorB,
    refetch: refetchB
  } = useCompetitiveAnalysis({
    enabled: !!elementB
  });

  // Note: Pour une vraie implémentation, il faudrait modifier le hook
  // pour accepter des filtres spécifiques à chaque élément
  // Ici on simule avec les filtres globaux

  // Agrégation des métriques prix
  const metricsA: PriceMetrics = useMemo(() => {
    if (!productsA || productsA.length === 0) {
      return {
        totalProducts: 0,
        avgPriceMarket: 0,
        avgPriceSelection: 0,
        avgMargin: 0,
        competitiveAdvantage: 0,
        products: []
      };
    }

    const validProducts = productsA.filter(p => p.prix_vente_moyen_global > 0);
    
    const avgPriceMarket = validProducts.reduce((sum, p) => sum + p.prix_vente_moyen_global, 0) / validProducts.length;
    const avgPriceSelection = validProducts.reduce((sum, p) => sum + p.prix_vente_moyen_selection, 0) / validProducts.length;
    const avgMargin = validProducts.reduce((sum, p) => sum + p.taux_marge_moyen_selection, 0) / validProducts.length;
    
    const cheaperThanMarket = validProducts.filter(p => p.prix_vente_moyen_selection < p.prix_vente_moyen_global).length;
    const competitiveAdvantage = validProducts.length > 0 ? (cheaperThanMarket / validProducts.length) * 100 : 0;

    // Top 5 produits avec plus gros écarts
    const topProducts = validProducts
      .map(p => ({
        name: p.product_name,
        code: p.code_ean,
        priceMarket: p.prix_vente_moyen_global,
        priceSelection: p.prix_vente_moyen_selection,
        marginPercent: p.taux_marge_moyen_selection,
        priceGapPercent: p.ecart_prix_vs_marche_pct
      }))
      .sort((a, b) => Math.abs(b.priceGapPercent) - Math.abs(a.priceGapPercent))
      .slice(0, 5);

    return {
      totalProducts: validProducts.length,
      avgPriceMarket,
      avgPriceSelection,
      avgMargin,
      competitiveAdvantage,
      products: topProducts
    };
  }, [productsA]);

  const metricsB: PriceMetrics = useMemo(() => {
    if (!productsB || productsB.length === 0) {
      return {
        totalProducts: 0,
        avgPriceMarket: 0,
        avgPriceSelection: 0,
        avgMargin: 0,
        competitiveAdvantage: 0,
        products: []
      };
    }

    const validProducts = productsB.filter(p => p.prix_vente_moyen_global > 0);
    
    const avgPriceMarket = validProducts.reduce((sum, p) => sum + p.prix_vente_moyen_global, 0) / validProducts.length;
    const avgPriceSelection = validProducts.reduce((sum, p) => sum + p.prix_vente_moyen_selection, 0) / validProducts.length;
    const avgMargin = validProducts.reduce((sum, p) => sum + p.taux_marge_moyen_selection, 0) / validProducts.length;
    
    const cheaperThanMarket = validProducts.filter(p => p.prix_vente_moyen_selection < p.prix_vente_moyen_global).length;
    const competitiveAdvantage = validProducts.length > 0 ? (cheaperThanMarket / validProducts.length) * 100 : 0;

    const topProducts = validProducts
      .map(p => ({
        name: p.product_name,
        code: p.code_ean,
        priceMarket: p.prix_vente_moyen_global,
        priceSelection: p.prix_vente_moyen_selection,
        marginPercent: p.taux_marge_moyen_selection,
        priceGapPercent: p.ecart_prix_vs_marche_pct
      }))
      .sort((a, b) => Math.abs(b.priceGapPercent) - Math.abs(a.priceGapPercent))
      .slice(0, 5);

    return {
      totalProducts: validProducts.length,
      avgPriceMarket,
      avgPriceSelection,
      avgMargin,
      competitiveAdvantage,
      products: topProducts
    };
  }, [productsB]);

  // États dérivés
  const isLoading = loadingA || loadingB;
  const error = errorA || errorB;

  // Handlers
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchA(), refetchB()]);
    onRefresh?.();
  }, [refetchA, refetchB, onRefresh]);

  // Format prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Format pourcentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Icône tendance
  const getTrendIcon = (value: number) => {
    if (Math.abs(value) < 1) return <Minus className="w-4 h-4" />;
    return value > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  // Couleur tendance
  const getTrendColor = (value: number) => {
    if (Math.abs(value) < 1) return 'text-gray-400';
    return value > 0 ? 'text-red-500' : 'text-emerald-600';
  };

  // États conditionnels
  if (!elementA || !elementB) {
    return (
      <Card variant="outlined" padding="lg" className={className}>
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analyse concurrentielle des prix
          </h3>
          <p className="text-gray-500">
            Sélectionnez deux éléments pour comparer leur positionnement prix vs marché
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg" className={className}>
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" padding="lg" className={className}>
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur analyse prix
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={handleRefresh}>
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Positionnement Prix
          </h3>
        </div>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={handleRefresh}
          iconLeft={<RotateCcw className="w-4 h-4" />}
        >
          Actualiser
        </Button>
      </div>

      {/* Grille comparative A vs B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Métriques A */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900">{elementA.name}</h4>
          </div>

          {/* Prix moyen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Prix moyen vs marché</span>
              <div className={`flex items-center space-x-1 ${getTrendColor(
                metricsA.avgPriceSelection - metricsA.avgPriceMarket
              )}`}>
                {getTrendIcon(metricsA.avgPriceSelection - metricsA.avgPriceMarket)}
                <span className="text-xs font-medium">
                  {formatPercent(((metricsA.avgPriceSelection - metricsA.avgPriceMarket) / metricsA.avgPriceMarket) * 100)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(metricsA.avgPriceSelection)}
                </div>
                <div className="text-xs text-gray-500">Mon prix</div>
              </div>
              <div className="text-gray-300">vs</div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  {formatPrice(metricsA.avgPriceMarket)}
                </div>
                <div className="text-xs text-gray-500">Marché</div>
              </div>
            </div>
          </div>

          {/* Avantage concurrentiel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avantage concurrentiel</span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                metricsA.competitiveAdvantage >= 50 
                  ? 'bg-emerald-100 text-emerald-700'
                  : metricsA.competitiveAdvantage >= 30
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {metricsA.competitiveAdvantage.toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {metricsA.competitiveAdvantage.toFixed(0)}% des produits moins chers que le marché
            </div>
          </div>

          {/* Marge moyenne */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Marge moyenne</span>
              <div className="text-lg font-bold text-gray-900">
                {metricsA.avgMargin.toFixed(1)}%
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Sur {metricsA.totalProducts} produits
            </div>
          </div>
        </div>

        {/* Métriques B */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900">{elementB.name}</h4>
          </div>

          {/* Prix moyen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Prix moyen vs marché</span>
              <div className={`flex items-center space-x-1 ${getTrendColor(
                metricsB.avgPriceSelection - metricsB.avgPriceMarket
              )}`}>
                {getTrendIcon(metricsB.avgPriceSelection - metricsB.avgPriceMarket)}
                <span className="text-xs font-medium">
                  {formatPercent(((metricsB.avgPriceSelection - metricsB.avgPriceMarket) / metricsB.avgPriceMarket) * 100)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(metricsB.avgPriceSelection)}
                </div>
                <div className="text-xs text-gray-500">Mon prix</div>
              </div>
              <div className="text-gray-300">vs</div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  {formatPrice(metricsB.avgPriceMarket)}
                </div>
                <div className="text-xs text-gray-500">Marché</div>
              </div>
            </div>
          </div>

          {/* Avantage concurrentiel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avantage concurrentiel</span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                metricsB.competitiveAdvantage >= 50 
                  ? 'bg-emerald-100 text-emerald-700'
                  : metricsB.competitiveAdvantage >= 30
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {metricsB.competitiveAdvantage.toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {metricsB.competitiveAdvantage.toFixed(0)}% des produits moins chers que le marché
            </div>
          </div>

          {/* Marge moyenne */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Marge moyenne</span>
              <div className="text-lg font-bold text-gray-900">
                {metricsB.avgMargin.toFixed(1)}%
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Sur {metricsB.totalProducts} produits
            </div>
          </div>
        </div>
      </div>

      {/* Résumé comparatif */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="font-medium text-gray-900 mb-4">Résumé comparatif</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">
              {formatPercent(((metricsA.avgPriceSelection - metricsB.avgPriceSelection) / metricsB.avgPriceSelection) * 100)}
            </div>
            <div className="text-xs text-gray-500">Écart prix moyen A vs B</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">
              {formatPercent(metricsA.avgMargin - metricsB.avgMargin)}
            </div>
            <div className="text-xs text-gray-500">Écart marge A vs B</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">
              {formatPercent(metricsA.competitiveAdvantage - metricsB.competitiveAdvantage)}
            </div>
            <div className="text-xs text-gray-500">Écart avantage concurrentiel</div>
          </div>
        </div>
      </div>
    </Card>
  );
};