// src/components/organisms/ComparisonPricingSection/ComparisonPricingSection.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw, AlertCircle, ArrowLeftRight, TrendingDown, TrendingUp, Eye, DollarSign } from 'lucide-react';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { useComparisonPricing } from '@/hooks/competitive/useComparisonPricing';
import { CsvExporter } from '@/utils/export/csvExporter';

interface ComparisonPricingSectionProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

interface PriceComparisonData {
  readonly elementName: string;
  readonly position: 'A' | 'B' | 'C';
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
 * ComparisonPricingSection - Analyse comparative des prix A vs B vs C
 * Avec export CSV intégré
 * 
 * Features :
 * - Utilise API /api/competitive-analysis existante
 * - 3 requêtes parallèles avec productCodes A, B et C
 * - Grid 3 colonnes responsive
 * - Export CSV complet avec comparaisons
 * - Indicateurs écarts concurrentiels 
 * - États vides engageants
 * - Design cohérent Apple/Stripe
 */
export const ComparisonPricingSection: React.FC<ComparisonPricingSectionProps> = ({
  className = '',
  onRefresh
}) => {
  // Store comparison pour les éléments sélectionnés
  const { elementA, elementB, elementC } = useComparisonStore();

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

  // Hook pricing comparison dédié
  const { 
    productsA, 
    productsB,
    productsC,
    isLoading, 
    error,
    refetch,
    hasDataA,
    hasDataB,
    hasDataC
  } = useComparisonPricing({
    enabled: true,
    elementA,
    elementB,
    elementC
  });

  // Fonction générique pour calculer les données de comparaison
  const createComparisonData = useCallback((
    element: typeof elementA, 
    products: any[], 
    position: 'A' | 'B' | 'C',
    hasData: boolean
  ): PriceComparisonData | null => {
    if (!element || !hasData || products.length === 0) return null;

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
      return {
        elementName: element.name,
        position,
        products,
        summary: {
          avgSellingPrice: 0,
          minMarketPrice: Math.min(...products.map(p => parseFloat(String(p.prix_vente_min_global))).filter(p => p > 0)),
          maxMarketPrice: Math.max(...products.map(p => parseFloat(String(p.prix_vente_max_global)))),
          avgMarginRate: 0,
          marketGap: 0,
          totalProducts: products.length
        }
      };
    }

    const avgSellingPrice = validProducts.reduce((sum, p) => sum + parseFloat(String(p.prix_vente_moyen_selection)), 0) / validProducts.length;
    const minMarketPrice = Math.min(...products.map(p => parseFloat(String(p.prix_vente_min_global))).filter(p => p > 0));
    const maxMarketPrice = Math.max(...products.map(p => parseFloat(String(p.prix_vente_max_global))));
    const avgMarginRate = validProducts.reduce((sum, p) => sum + parseFloat(String(p.taux_marge_moyen_selection)), 0) / validProducts.length;
    const marketGap = validProducts.reduce((sum, p) => sum + parseFloat(String(p.ecart_prix_vs_marche_pct)), 0) / validProducts.length;

    return {
      elementName: element.name,
      position,
      products,
      summary: {
        avgSellingPrice,
        minMarketPrice,
        maxMarketPrice,
        avgMarginRate,
        marketGap,
        totalProducts: products.length
      }
    };
  }, []);

  // Calcul données comparaison pour chaque élément
  const comparisonDataA = useMemo(() => 
    createComparisonData(elementA, productsA, 'A', hasDataA),
    [elementA, productsA, hasDataA, createComparisonData]
  );

  const comparisonDataB = useMemo(() => 
    createComparisonData(elementB, productsB, 'B', hasDataB),
    [elementB, productsB, hasDataB, createComparisonData]
  );

  const comparisonDataC = useMemo(() => 
    createComparisonData(elementC, productsC, 'C', hasDataC),
    [elementC, productsC, hasDataC, createComparisonData]
  );

  // Préparation données pour export CSV
  const prepareComparisonDataForExport = useCallback(() => {
    const exportData = [];
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    const activeComparisons = [comparisonDataA, comparisonDataB, comparisonDataC].filter(Boolean);
    
    if (activeComparisons.length >= 2) {
      // Résumé comparatif global
      exportData.push({
        'Type': 'Résumé Comparatif Global',
        'Élément A': comparisonDataA?.elementName || 'Non sélectionné',
        'Élément B': comparisonDataB?.elementName || 'Non sélectionné',
        'Élément C': comparisonDataC?.elementName || 'Non sélectionné',
        'Date Export': currentDate,
        'Métrique': 'Comparaison Générale',
        'Valeur A': (comparisonDataA?.summary.avgSellingPrice ?? 0) > 0 ? 'Données disponibles' : 'Aucune vente',
        'Valeur B': (comparisonDataB?.summary.avgSellingPrice ?? 0) > 0 ? 'Données disponibles' : 'Aucune vente',
        'Valeur C': (comparisonDataC?.summary.avgSellingPrice ?? 0) > 0 ? 'Données disponibles' : 'Aucune vente'
      });

      // Comparaisons détaillées si au moins 2 éléments ont des ventes
      const elementsWithSales = activeComparisons.filter(comp => comp?.summary.avgSellingPrice && comp.summary.avgSellingPrice > 0);
      
      if (elementsWithSales.length >= 2) {
        // Prix de vente comparaison
        exportData.push({
          'Type': 'Comparaison Prix',
          'Élément A': comparisonDataA?.elementName || '',
          'Élément B': comparisonDataB?.elementName || '',
          'Élément C': comparisonDataC?.elementName || '',
          'Date Export': currentDate,
          'Métrique': 'Prix de vente moyen',
          'Valeur A': comparisonDataA?.summary.avgSellingPrice ? comparisonDataA.summary.avgSellingPrice.toFixed(2) + ' €' : '',
          'Valeur B': comparisonDataB?.summary.avgSellingPrice ? comparisonDataB.summary.avgSellingPrice.toFixed(2) + ' €' : '',
          'Valeur C': comparisonDataC?.summary.avgSellingPrice ? comparisonDataC.summary.avgSellingPrice.toFixed(2) + ' €' : ''
        });

        // Taux de marge comparaison
        exportData.push({
          'Type': 'Comparaison Marge',
          'Élément A': comparisonDataA?.elementName || '',
          'Élément B': comparisonDataB?.elementName || '',
          'Élément C': comparisonDataC?.elementName || '',
          'Date Export': currentDate,
          'Métrique': 'Taux de marge moyen',
          'Valeur A': comparisonDataA?.summary.avgMarginRate ? comparisonDataA.summary.avgMarginRate.toFixed(1) + ' %' : '',
          'Valeur B': comparisonDataB?.summary.avgMarginRate ? comparisonDataB.summary.avgMarginRate.toFixed(1) + ' %' : '',
          'Valeur C': comparisonDataC?.summary.avgMarginRate ? comparisonDataC.summary.avgMarginRate.toFixed(1) + ' %' : ''
        });
      }
    }

    // Détails par élément
    [comparisonDataA, comparisonDataB, comparisonDataC].forEach((data, index) => {
      if (data) {
        const position = ['A', 'B', 'C'][index];
        exportData.push({
          'Type': `Détail Élément ${position}`,
          'Élément A': position === 'A' ? data.elementName : '',
          'Élément B': position === 'B' ? data.elementName : '',
          'Élément C': position === 'C' ? data.elementName : '',
          'Date Export': currentDate,
          'Métrique': 'Nombre total produits',
          'Valeur A': position === 'A' ? data.summary.totalProducts.toString() : '',
          'Valeur B': position === 'B' ? data.summary.totalProducts.toString() : '',
          'Valeur C': position === 'C' ? data.summary.totalProducts.toString() : ''
        });
      }
    });
    
    return exportData;
  }, [comparisonDataA, comparisonDataB, comparisonDataC]);

  // Handler export avec vérifications pour 3 éléments
  const handleExport = useCallback(() => {
    const selectedElements = [elementA, elementB, elementC].filter(Boolean);
    if (selectedElements.length === 0) {
      console.warn('Aucun élément sélectionné pour export');
      return;
    }
    
    const exportData = prepareComparisonDataForExport();
    if (exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    const elementNames = selectedElements.map(el => el?.name || 'vide').join('_vs_');
    const filename = CsvExporter.generateFilename(`apodata_comparaison_prix_${elementNames}`);
    
    if (!exportData[0]) {
      console.error('Données export invalides');
      return;
    }
    
    const headers = Object.keys(exportData[0]);
    exportToCsv({ filename, headers, data: exportData });
  }, [elementA, elementB, elementC, prepareComparisonDataForExport, exportToCsv]);

  // Handler refresh avec callback externe
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Format currency
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

  // États conditionnels optimisés
  const selectedElementsCount = [elementA, elementB, elementC].filter(Boolean).length;
  const selectedElementsWithData = [comparisonDataA, comparisonDataB, comparisonDataC].filter(Boolean).length;

  if (selectedElementsCount === 0) {
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
              Sélectionnez au moins deux éléments ci-dessus pour découvrir leurs positionnements 
              prix et analyser leur compétitivité sur le marché.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedElementsCount === 1) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse comparative des prix
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              1 élément sélectionné
            </p>
          </div>
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={isLoading}
            label="Export élément sélectionné"
            size="sm"
          />
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
              Ajoutez au moins un autre élément pour comparer les positionnements tarifaires
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header avec indicateurs éléments et export */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analyse comparative des prix
          </h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              {elementA && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                    {elementA.name}
                  </span>
                </div>
              )}
              {elementB && (
                <>
                  {elementA && <ArrowLeftRight className="w-4 h-4 text-gray-400" />}
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {elementB.name}
                    </span>
                  </div>
                </>
              )}
              {elementC && (
                <>
                  {(elementA || elementB) && <ArrowLeftRight className="w-4 h-4 text-gray-400" />}
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {elementC.name}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {selectedElementsWithData > 0 && !isLoading && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-600">
                  {(comparisonDataA?.summary.totalProducts || 0) + 
                   (comparisonDataB?.summary.totalProducts || 0) + 
                   (comparisonDataC?.summary.totalProducts || 0)} produits analysés
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center space-x-2">
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={isLoading || selectedElementsWithData === 0}
            label="Export Comparaison"
            size="sm"
          />
          
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

      {/* Grid colonnes responsive - utilise la structure existante */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne A */}
        {elementA && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">{elementA.name}</h3>
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
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Aucune vente enregistrée</p>
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
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Votre prix de vente</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(comparisonDataA.summary.avgSellingPrice)}
                      </span>
                    </div>
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Écart vs apothical</span>
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
                  <p className="text-sm text-gray-500">Aucune donnée tarifaire disponible</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Colonne B */}
        {elementB && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">{elementB.name}</h3>
              {comparisonDataB && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  {comparisonDataB.summary.totalProducts} produits
                </span>
              )}
            </div>
            
            {/* Structure identique à A avec couleurs purple */}
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
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Aucune vente enregistrée</p>
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
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Votre prix de vente</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(comparisonDataB.summary.avgSellingPrice)}
                      </span>
                    </div>
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Écart vs apothical</span>
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
                  <p className="text-sm text-gray-500">Aucune donnée tarifaire disponible</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Colonne C */}
        {elementC && (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">{elementC.name}</h3>
              {comparisonDataC && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                  {comparisonDataC.summary.totalProducts} produits
                </span>
              )}
            </div>
            
            {/* Structure identique avec couleurs emerald */}
            {isLoading && !comparisonDataC ? (
              <Card variant="outlined" padding="lg">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ) : comparisonDataC ? (
              <Card variant="elevated" padding="lg">
                {comparisonDataC.summary.avgSellingPrice === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Aucune vente enregistrée</p>
                    <p className="text-xs text-gray-500">
                      Vous ne vendez actuellement aucun produit {elementC.type === 'laboratory' ? 'de ce laboratoire' : 'de cette catégorie'} 
                      sur la période sélectionnée.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Produits disponibles :</span>
                        <span className="font-medium">{comparisonDataC.summary.totalProducts}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Prix marché :</span>
                        <span className="font-medium">
                          {formatCurrency(comparisonDataC.summary.minMarketPrice)} - {formatCurrency(comparisonDataC.summary.maxMarketPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Votre prix de vente</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(comparisonDataC.summary.avgSellingPrice)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Prix marché min</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(comparisonDataC.summary.minMarketPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Prix marché max</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(comparisonDataC.summary.maxMarketPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Taux de marge moyen</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                        comparisonDataC.summary.avgMarginRate >= 30 
                          ? 'text-green-700 bg-green-100'
                          : comparisonDataC.summary.avgMarginRate >= 20
                          ? 'text-orange-600 bg-orange-100'
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {comparisonDataC.summary.avgMarginRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Écart vs apothical</span>
                      <div className="flex items-center space-x-2">
                        {comparisonDataC.summary.marketGap >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-bold ${
                          comparisonDataC.summary.marketGap >= 0 
                            ? 'text-emerald-600' 
                            : 'text-red-500'
                        }`}>
                          {formatPercentage(comparisonDataC.summary.marketGap)}
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
                  <p className="text-sm text-gray-500">Aucune donnée tarifaire disponible</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder si aucun élément pour maintenir la grid */}
        {!elementA && !elementB && !elementC && (
          <div className="col-span-3">
            <Card variant="outlined" padding="lg" className="text-center">
              <div className="py-6">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Aucun élément sélectionné</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Résumé comparatif global si au moins 2 éléments ont des données */}
      {selectedElementsWithData >= 2 && !isLoading && (
        <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 border-none">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Résumé comparatif global
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prix moyen */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Prix de vente moyen</p>
                <div className="space-y-1">
                  {(comparisonDataA?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-blue-600 font-medium">A: </span>
                      {formatCurrency(comparisonDataA?.summary.avgSellingPrice ?? 0)}
                    </div>
                  )}
                  {(comparisonDataB?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-purple-600 font-medium">B: </span>
                      {formatCurrency(comparisonDataB?.summary.avgSellingPrice ?? 0)}
                    </div>
                  )}
                  {(comparisonDataC?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-emerald-600 font-medium">C: </span>
                      {formatCurrency(comparisonDataC?.summary.avgSellingPrice ?? 0)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Marge */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Taux de marge moyen</p>
                <div className="space-y-1">
                  {(comparisonDataA?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-blue-600 font-medium">A: </span>
                      {comparisonDataA?.summary.avgMarginRate.toFixed(1)}%
                    </div>
                  )}
                  {(comparisonDataB?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-purple-600 font-medium">B: </span>
                      {comparisonDataB?.summary.avgMarginRate.toFixed(1)}%
                    </div>
                  )}
                  {(comparisonDataC?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-emerald-600 font-medium">C: </span>
                      {comparisonDataC?.summary.avgMarginRate.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
              
              {/* Écart marché */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Écart vs apothical</p>
                <div className="space-y-1">
                  {(comparisonDataA?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-blue-600 font-medium">A: </span>
                      {formatPercentage(comparisonDataA?.summary.marketGap ?? 0)}
                    </div>
                  )}
                  {(comparisonDataB?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-purple-600 font-medium">B: </span>
                      {formatPercentage(comparisonDataB?.summary.marketGap ?? 0)}
                    </div>
                  )}
                  {(comparisonDataC?.summary.avgSellingPrice ?? 0) > 0 && (
                    <div className="text-sm">
                      <span className="text-emerald-600 font-medium">C: </span>
                      {formatPercentage(comparisonDataC?.summary.marketGap ?? 0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};