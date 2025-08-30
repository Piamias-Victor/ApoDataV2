// src/components/organisms/ComparisonPricingSection/ComparisonPricingSection.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw, AlertCircle, ArrowLeftRight, TrendingDown, TrendingUp, Eye, DollarSign } from 'lucide-react';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { useComparisonPricing } from '@/hooks/competitive/useComparisonPricing';

interface ComparisonPricingSectionProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

interface PriceComparisonData {
  readonly elementName: string;
  readonly position: 'A' | 'B';
  readonly products: any[];
  readonly summary: {
    readonly avgSellingPrice: number;
    readonly minMarketPrice: number;
    readonly maxMarketPrice: number;
    readonly avgMarginRate: number;
    readonly marketGap: number;
    readonly totalProducts: number;
  };
}

/**
 * ComparisonPricingSection - Analyse comparative des prix A vs B
 * 
 * Features :
 * - Utilise API /api/competitive-analysis existante
 * - 2 requêtes parallèles avec productCodes A et B
 * - Tableau side-by-side résumés prix/marges
 * - Indicateurs écarts concurrentiels 
 * - États vides engageants
 * - Design cohérent Apple/Stripe
 */
export const ComparisonPricingSection: React.FC<ComparisonPricingSectionProps> = ({
  className = '',
  onRefresh
}) => {
  // Store comparison pour les éléments sélectionnés
  const { elementA, elementB } = useComparisonStore();

  // Hook pricing comparison dédié
  const { 
    productsA, 
    productsB,
    isLoading, 
    error,
    refetch,
    hasDataA,
    hasDataB 
  } = useComparisonPricing({
    enabled: true,
    elementA,
    elementB
  });

  // Calcul données comparaison pour chaque élément
  const comparisonDataA = useMemo((): PriceComparisonData | null => {
    if (!elementA || !hasDataA) return null;

    const products = productsA;
    const totalProducts = products.length;
    
    if (totalProducts === 0) return null;

    // Filtrer produits avec données valides pour moyennes (seulement ceux vendus)
    const validProducts = products.filter(p => {
      const priceSelection = parseFloat(String(p.prix_vente_moyen_selection));
      const marginRate = parseFloat(String(p.taux_marge_moyen_selection));
      const marketGap = parseFloat(String(p.ecart_prix_vs_marche_pct));
      
      return (
        priceSelection > 0 &&
        !isNaN(priceSelection) &&
        marginRate > 0 &&
        !isNaN(marginRate) &&
        !isNaN(marketGap)
      );
    });

    if (validProducts.length === 0) {
      // Aucun produit vendu dans votre pharmacie pour ce laboratoire/catégorie
      return {
        elementName: elementA.name,
        position: 'A',
        products,
        summary: {
          avgSellingPrice: 0,
          minMarketPrice: Math.min(...products.map(p => parseFloat(String(p.prix_vente_min_global))).filter(p => p > 0)),
          maxMarketPrice: Math.max(...products.map(p => parseFloat(String(p.prix_vente_max_global)))),
          avgMarginRate: 0,
          marketGap: 0,
          totalProducts
        }
      };
    }

    const avgSellingPrice = validProducts.reduce((sum, p) => sum + parseFloat(String(p.prix_vente_moyen_selection)), 0) / validProducts.length;
    const minMarketPrice = Math.min(...products.map(p => parseFloat(String(p.prix_vente_min_global))).filter(p => p > 0));
    const maxMarketPrice = Math.max(...products.map(p => parseFloat(String(p.prix_vente_max_global))));
    const avgMarginRate = validProducts.reduce((sum, p) => sum + parseFloat(String(p.taux_marge_moyen_selection)), 0) / validProducts.length;
    const marketGap = validProducts.reduce((sum, p) => sum + parseFloat(String(p.ecart_prix_vs_marche_pct)), 0) / validProducts.length;

    return {
      elementName: elementA.name,
      position: 'A',
      products,
      summary: {
        avgSellingPrice,
        minMarketPrice,
        maxMarketPrice,
        avgMarginRate,
        marketGap,
        totalProducts
      }
    };
  }, [elementA, hasDataA, productsA]);

  const comparisonDataB = useMemo((): PriceComparisonData | null => {
    if (!elementB || !hasDataB) return null;

    const products = productsB;
    const totalProducts = products.length;
    
    if (totalProducts === 0) return null;

    // Filtrer produits avec données valides pour moyennes (seulement ceux vendus)
    const validProducts = products.filter(p => {
      const priceSelection = parseFloat(String(p.prix_vente_moyen_selection));
      const marginRate = parseFloat(String(p.taux_marge_moyen_selection));
      const marketGap = parseFloat(String(p.ecart_prix_vs_marche_pct));
      
      return (
        priceSelection > 0 &&
        !isNaN(priceSelection) &&
        marginRate > 0 &&
        !isNaN(marginRate) &&
        !isNaN(marketGap)
      );
    });

    if (validProducts.length === 0) {
      // Aucun produit vendu dans votre pharmacie pour ce laboratoire/catégorie
      return {
        elementName: elementB.name,
        position: 'B',
        products,
        summary: {
          avgSellingPrice: 0,
          minMarketPrice: Math.min(...products.map(p => parseFloat(String(p.prix_vente_min_global))).filter(p => p > 0)),
          maxMarketPrice: Math.max(...products.map(p => parseFloat(String(p.prix_vente_max_global)))),
          avgMarginRate: 0,
          marketGap: 0,
          totalProducts
        }
      };
    }

    const avgSellingPrice = validProducts.reduce((sum, p) => sum + parseFloat(String(p.prix_vente_moyen_selection)), 0) / validProducts.length;
    const minMarketPrice = Math.min(...products.map(p => parseFloat(String(p.prix_vente_min_global))).filter(p => p > 0));
    const maxMarketPrice = Math.max(...products.map(p => parseFloat(String(p.prix_vente_max_global))));
    const avgMarginRate = validProducts.reduce((sum, p) => sum + parseFloat(String(p.taux_marge_moyen_selection)), 0) / validProducts.length;
    const marketGap = validProducts.reduce((sum, p) => sum + parseFloat(String(p.ecart_prix_vs_marche_pct)), 0) / validProducts.length;

    return {
      elementName: elementB.name,
      position: 'B',
      products,
      summary: {
        avgSellingPrice,
        minMarketPrice,
        maxMarketPrice,
        avgMarginRate,
        marketGap,
        totalProducts
      }
    };
  }, [elementB, hasDataB, productsB]);

  // Handler refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Format currency - accepte number ou string
  const formatCurrency = useCallback((value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }, []);

  // États conditionnels
  if (!elementA && !elementB) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse comparative des prix
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Comparez les positionnements tarifaires de vos éléments sélectionnés
            </p>
          </div>
        </div>

        <Card variant="interactive" padding="xl" className="text-center">
          <div className="py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <DollarSign className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Analyse tarifaire en attente
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Sélectionnez deux éléments ci-dessus pour découvrir leurs positionnements 
              prix et analyser leur compétitivité sur le marché.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!elementA || !elementB) {
    const selectedElement = elementA || elementB;
    const position = elementA ? 'A' : 'B';
    const missing = elementA ? 'B' : 'A';

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse comparative des prix
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Élément {position} : {selectedElement?.name}
            </p>
          </div>
        </div>

        <Card variant="outlined" padding="xl" className="text-center">
          <div className="py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Comparaison prix en attente
            </h3>
            <p className="text-gray-600 mb-4">
              Ajoutez un élément {missing} pour comparer les positionnements tarifaires
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${position === 'A' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
              <span className="text-sm font-medium text-gray-700">{selectedElement?.name}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header avec indicateurs éléments */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analyse comparative des prix
          </h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                  {elementA.name}
                </span>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                  {elementB.name}
                </span>
              </div>
            </div>
            
            {comparisonDataA && comparisonDataB && !isLoading && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-600">
                  {comparisonDataA.summary.totalProducts + comparisonDataB.summary.totalProducts} produits analysés
                </span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          iconLeft={<RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Actualiser
        </Button>
      </div>

      {/* État d'erreur */}
      {error && (
        <Card variant="outlined" padding="md" className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Erreur de chargement des données tarifaires
              </p>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tableau comparatif side-by-side */}
      {(comparisonDataA || comparisonDataB) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Colonne A */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {elementA.name}
              </h3>
              {comparisonDataA && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {comparisonDataA.summary.totalProducts} produits
                </span>
              )}
            </div>
            
            {isLoading && !comparisonDataA ? (
              <Card variant="outlined" padding="lg">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ) : comparisonDataA ? (
              <Card variant="elevated" padding="lg">
                {comparisonDataA.summary.avgSellingPrice === 0 ? (
                  // Cas où aucun produit du laboratoire/catégorie n'est vendu
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Aucune vente enregistrée
                    </p>
                    <p className="text-xs text-gray-500">
                      Vous ne vendez actuellement aucun produit {elementA.type === 'laboratory' ? 'de ce laboratoire' : 'de cette catégorie'} 
                      sur la période sélectionnée.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Produits disponibles :</span>
                        <span className="font-medium">{comparisonDataA.summary.totalProducts}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Prix marché :</span>
                        <span className="font-medium">
                          {formatCurrency(comparisonDataA.summary.minMarketPrice)} - {formatCurrency(comparisonDataA.summary.maxMarketPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Prix de vente moyen */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Votre prix de vente</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(comparisonDataA.summary.avgSellingPrice)}
                      </span>
                    </div>
                    
                    {/* Fourchette marché */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Prix marché min</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(comparisonDataA.summary.minMarketPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Prix marché max</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(comparisonDataA.summary.maxMarketPrice)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Taux de marge */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Taux de marge moyen</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                        comparisonDataA.summary.avgMarginRate >= 30 
                          ? 'text-green-700 bg-green-100'
                          : comparisonDataA.summary.avgMarginRate >= 20
                          ? 'text-orange-600 bg-orange-100'
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {comparisonDataA.summary.avgMarginRate.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Écart vs marché */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Écart vs marché</span>
                      <div className="flex items-center space-x-2">
                        {comparisonDataA.summary.marketGap >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-bold ${
                          comparisonDataA.summary.marketGap >= 0 
                            ? 'text-emerald-600' 
                            : 'text-red-500'
                        }`}>
                          {formatPercentage(comparisonDataA.summary.marketGap)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card variant="outlined" padding="lg" className="text-center">
                <div className="py-6">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Aucune donnée tarifaire disponible
                  </p>
                </div>
              </Card>
            )}
          </div>
          
          {/* Colonne B */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {elementB.name}
              </h3>
              {comparisonDataB && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  {comparisonDataB.summary.totalProducts} produits
                </span>
              )}
            </div>
            
            {isLoading && !comparisonDataB ? (
              <Card variant="outlined" padding="lg">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ) : comparisonDataB ? (
              <Card variant="elevated" padding="lg">
                {comparisonDataB.summary.avgSellingPrice === 0 ? (
                  // Cas où aucun produit du laboratoire/catégorie n'est vendu
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Aucune vente enregistrée
                    </p>
                    <p className="text-xs text-gray-500">
                      Vous ne vendez actuellement aucun produit {elementB.type === 'laboratory' ? 'de ce laboratoire' : 'de cette catégorie'} 
                      sur la période sélectionnée.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Produits disponibles :</span>
                        <span className="font-medium">{comparisonDataB.summary.totalProducts}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Prix marché :</span>
                        <span className="font-medium">
                          {formatCurrency(comparisonDataB.summary.minMarketPrice)} - {formatCurrency(comparisonDataB.summary.maxMarketPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Prix de vente moyen */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Votre prix de vente</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(comparisonDataB.summary.avgSellingPrice)}
                      </span>
                    </div>
                    
                    {/* Fourchette marché */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Prix marché min</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(comparisonDataB.summary.minMarketPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Prix marché max</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(comparisonDataB.summary.maxMarketPrice)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Taux de marge */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Taux de marge moyen</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                        comparisonDataB.summary.avgMarginRate >= 30 
                          ? 'text-green-700 bg-green-100'
                          : comparisonDataB.summary.avgMarginRate >= 20
                          ? 'text-orange-600 bg-orange-100'
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {comparisonDataB.summary.avgMarginRate.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Écart vs marché */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Écart vs marché</span>
                      <div className="flex items-center space-x-2">
                        {comparisonDataB.summary.marketGap >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-bold ${
                          comparisonDataB.summary.marketGap >= 0 
                            ? 'text-emerald-600' 
                            : 'text-red-500'
                        }`}>
                          {formatPercentage(comparisonDataB.summary.marketGap)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card variant="outlined" padding="lg" className="text-center">
                <div className="py-6">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Aucune donnée tarifaire disponible
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Résumé comparatif si les deux éléments ont des données */}
      {comparisonDataA && comparisonDataB && !isLoading && (
        comparisonDataA.summary.avgSellingPrice > 0 && comparisonDataB.summary.avgSellingPrice > 0 ? (
          <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Résumé comparatif
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Prix moyen */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Votre prix de vente</p>
                  <div className="space-y-1">
                    <div className={`text-lg font-bold ${
                      comparisonDataA.summary.avgSellingPrice > comparisonDataB.summary.avgSellingPrice 
                        ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {comparisonDataA.summary.avgSellingPrice > comparisonDataB.summary.avgSellingPrice ? 'A > B' : 'A < B'}
                    </div>
                    <p className="text-xs text-gray-500">
                      Écart: {formatCurrency(Math.abs(comparisonDataA.summary.avgSellingPrice - comparisonDataB.summary.avgSellingPrice))}
                    </p>
                  </div>
                </div>
                
                {/* Marge */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Taux de marge moyen</p>
                  <div className="space-y-1">
                    <div className={`text-lg font-bold ${
                      comparisonDataA.summary.avgMarginRate > comparisonDataB.summary.avgMarginRate 
                        ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {comparisonDataA.summary.avgMarginRate > comparisonDataB.summary.avgMarginRate ? 'A > B' : 'A < B'}
                    </div>
                    <p className="text-xs text-gray-500">
                      Écart: {Math.abs(comparisonDataA.summary.avgMarginRate - comparisonDataB.summary.avgMarginRate).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {/* Écart marché */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Écart vs marché</p>
                  <div className="space-y-1">
                    <div className={`text-lg font-bold ${
                      comparisonDataA.summary.marketGap > comparisonDataB.summary.marketGap 
                        ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {comparisonDataA.summary.marketGap > comparisonDataB.summary.marketGap ? 'A > B' : 'A < B'}
                    </div>
                    <p className="text-xs text-gray-500">
                      Écart: {Math.abs(comparisonDataA.summary.marketGap - comparisonDataB.summary.marketGap).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="outlined" padding="lg" className="bg-amber-50 border-amber-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Comparaison limitée
              </h4>
              <p className="text-sm text-gray-600">
                {comparisonDataA.summary.avgSellingPrice === 0 && comparisonDataB.summary.avgSellingPrice === 0 
                  ? 'Vous ne vendez aucun produit de ces deux éléments sur la période sélectionnée.'
                  : comparisonDataA.summary.avgSellingPrice === 0
                  ? `Vous ne vendez aucun produit de ${elementA.name} sur cette période.`
                  : `Vous ne vendez aucun produit de ${elementB.name} sur cette période.`
                }
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Essayez de sélectionner des éléments que vous vendez activement ou étendez la période d'analyse.
              </p>
            </div>
          </Card>
        )
      )}
    </div>
  );
};