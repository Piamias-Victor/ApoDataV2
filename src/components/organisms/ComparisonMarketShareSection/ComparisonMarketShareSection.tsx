// src/components/organisms/ComparisonMarketShareSection/ComparisonMarketShareSection.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, AlertCircle, ArrowLeftRight, TrendingUp, Eye, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useComparisonMarketShare } from '@/hooks/comparisons/useComparisonMarketShare';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';

interface ComparisonMarketShareSectionProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

type HierarchyLevel = 'universe' | 'category' | 'family';

const HIERARCHY_LABELS: Record<HierarchyLevel, string> = {
  universe: 'Univers',
  category: 'Catégories',
  family: 'Familles'
};

/**
 * ComparisonMarketShareSection - Analyse parts de marché A vs B par hiérarchie
 * 
 * Fonctionnalités :
 * - Comparaison side-by-side des parts de marché A vs B
 * - 3 niveaux hiérarchiques : Univers, Catégories, Familles
 * - Barres de progression avec CA + Marge pour chaque élément
 * - Pagination synchronisée entre A et B
 * - Top 3 laboratoires par segment
 * - Design glassmorphism cohérent avec autres sections
 * - États loading/empty/error harmonisés
 */
export const ComparisonMarketShareSection: React.FC<ComparisonMarketShareSectionProps> = ({
  className = '',
  onRefresh
}) => {
  // Store comparison pour éléments sélectionnés
  const { elementA, elementB } = useComparisonStore();

  // État niveau hiérarchique
  const [activeLevel, setActiveLevel] = useState<HierarchyLevel>('category');

  // Hook comparaison market share
  const { 
    dataA, 
    dataB, 
    isLoading, 
    error, 
    refetch,
    hasDataA,
    hasDataB,
    currentPage,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage
  } = useComparisonMarketShare({
    enabled: true,
    elementA,
    elementB,
    hierarchyLevel: activeLevel
  });

  // Handler refresh avec callback externe
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Handler changement niveau hiérarchique
  const handleLevelChange = useCallback((level: HierarchyLevel) => {
    console.log('Switching hierarchy level:', level);
    setActiveLevel(level);
  }, []);

  // Formatage montants
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Formatage pourcentages
  const formatPercentage = useCallback((percentage: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  }, []);

  // Segments alignés pour comparaison (par nom de segment)
  const alignedSegments = useMemo(() => {
    if (!dataA && !dataB) return [];

    const segmentsA = dataA?.segments || [];
    const segmentsB = dataB?.segments || [];

    // Union des noms de segments (ordre A prioritaire)
    const allSegmentNames = new Set([
      ...segmentsA.map(s => s.segment_name),
      ...segmentsB.map(s => s.segment_name)
    ]);

    return Array.from(allSegmentNames).map(segmentName => {
      const segmentA = segmentsA.find(s => s.segment_name === segmentName);
      const segmentB = segmentsB.find(s => s.segment_name === segmentName);

      return {
        segment_name: segmentName,
        segmentA,
        segmentB
      };
    });
  }, [dataA, dataB]);

  // État aucun élément sélectionné
  if (!elementA && !elementB) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse parts de marché par hiérarchie
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Comparez les parts de marché de vos éléments par niveau hiérarchique
            </p>
          </div>
        </div>

        <Card variant="interactive" padding="xl" className="text-center">
          <div className="py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Sélectionnez des éléments à comparer
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Choisissez deux produits, laboratoires ou catégories ci-dessus pour analyser 
              leurs parts de marché respectives par niveau hiérarchique.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // État un seul élément sélectionné
  if (!elementA || !elementB) {
    const selectedElement = elementA || elementB;
    const position = elementA ? 'A' : 'B';
    const missing = elementA ? 'B' : 'A';

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse parts de marché par hiérarchie
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
              Comparaison en attente
            </h3>
            <p className="text-gray-600 mb-4">
              Ajoutez un élément {missing} pour comparer les parts de marché par hiérarchie
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
      {/* Header avec résumé */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analyse parts de marché par hiérarchie
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
                Erreur de chargement des parts de marché
              </p>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Onglets niveaux hiérarchiques */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        {Object.entries(HIERARCHY_LABELS).map(([level, label]) => (
          <button
            key={level}
            onClick={() => handleLevelChange(level as HierarchyLevel)}
            disabled={isLoading}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all
              ${activeLevel === level
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* États Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Données comparaison par segments */}
      {!isLoading && (hasDataA || hasDataB) && alignedSegments.length > 0 && (
        <>
          <div className="space-y-6">
            {alignedSegments.map((aligned, index) => (
              <div key={`${aligned.segment_name}-${index}`} className="space-y-4">
                {/* Header segment */}
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>{aligned.segment_name}</span>
                  </h3>
                </div>

                {/* Comparaison A vs B */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Élément A */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-medium text-gray-900">{elementA.name}</h4>
                      </div>
                    </div>

                    {aligned.segmentA ? (
                      <>
                        <div className="space-y-3">
                          {/* CA Section */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Part de Marché CA</span>
                              <span className="text-sm font-semibold text-blue-600">
                                {formatPercentage(aligned.segmentA.part_marche_ca_pct)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, aligned.segmentA.part_marche_ca_pct))}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>CA Sélection: {formatCurrency(aligned.segmentA.ca_selection)}</span>
                              <span>CA Total: {formatCurrency(aligned.segmentA.ca_total_segment)}</span>
                            </div>
                          </div>

                          {/* Marge Section */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Part de Marché Marge</span>
                              <span className="text-sm font-semibold text-green-600">
                                {formatPercentage(aligned.segmentA.part_marche_marge_pct)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-green-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, aligned.segmentA.part_marche_marge_pct))}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Marge: {formatCurrency(aligned.segmentA.marge_selection)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Labs A */}
                        {aligned.segmentA.top_brand_labs && aligned.segmentA.top_brand_labs.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Top 3 Laboratoires</h5>
                            <div className="space-y-1">
                              {aligned.segmentA.top_brand_labs.slice(0, 3).map((lab, labIndex) => (
                                <div key={labIndex} className="text-xs text-gray-600">
                                  <span className="font-medium">{lab.brand_lab}</span> - {formatCurrency(lab.ca_brand_lab)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">Pas de données pour ce segment</p>
                      </div>
                    )}
                  </div>

                  {/* Élément B */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <h4 className="font-medium text-gray-900">{elementB.name}</h4>
                      </div>
                    </div>

                    {aligned.segmentB ? (
                      <>
                        <div className="space-y-3">
                          {/* CA Section */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Part de Marché CA</span>
                              <span className="text-sm font-semibold text-purple-600">
                                {formatPercentage(aligned.segmentB.part_marche_ca_pct)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-purple-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, aligned.segmentB.part_marche_ca_pct))}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>CA Sélection: {formatCurrency(aligned.segmentB.ca_selection)}</span>
                              <span>CA Total: {formatCurrency(aligned.segmentB.ca_total_segment)}</span>
                            </div>
                          </div>

                          {/* Marge Section */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Part de Marché Marge</span>
                              <span className="text-sm font-semibold text-green-600">
                                {formatPercentage(aligned.segmentB.part_marche_marge_pct)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-green-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, aligned.segmentB.part_marche_marge_pct))}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Marge: {formatCurrency(aligned.segmentB.marge_selection)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Labs B */}
                        {aligned.segmentB.top_brand_labs && aligned.segmentB.top_brand_labs.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Top 3 Laboratoires</h5>
                            <div className="space-y-1">
                              {aligned.segmentB.top_brand_labs.slice(0, 3).map((lab, labIndex) => (
                                <div key={labIndex} className="text-xs text-gray-600">
                                  <span className="font-medium">{lab.brand_lab}</span> - {formatCurrency(lab.ca_brand_lab)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">Pas de données pour ce segment</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(dataA?.pagination.totalPages || 0) > 1 || (dataB?.pagination.totalPages || 0) > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {currentPage} • {alignedSegments.length} segments comparés
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousPage}
                  disabled={!canPreviousPage || isLoading}
                  iconLeft={<ChevronLeft className="w-4 h-4" />}
                >
                  Précédent
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPage}
                  disabled={!canNextPage || isLoading}
                  iconRight={<ChevronRight className="w-4 h-4" />}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* État Empty */}
      {!isLoading && alignedSegments.length === 0 && (hasDataA || hasDataB) && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune donnée pour {HIERARCHY_LABELS[activeLevel].toLowerCase()}
          </h3>
          
          <p className="text-gray-500 mb-4 max-w-md">
            Aucune activité détectée pour ce niveau hiérarchique sur la période sélectionnée.
            Vérifiez vos filtres ou changez de niveau.
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

      {/* Résumé technique */}
      {(hasDataA || hasDataB) && !isLoading && (
        <Card variant="outlined" padding="md" className="bg-gray-50 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {hasDataA && dataA && (
              <div>
                <div className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>{elementA.name}</span>
                </div>
                <div className="space-y-2 text-gray-600 pl-5">
                  <div className="flex justify-between">
                    <span>Segments trouvés:</span>
                    <span className="font-medium">{dataA.segments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps de calcul:</span>
                    <span className="font-medium">{dataA.queryTime}ms</span>
                  </div>
                </div>
              </div>
            )}
            
            {hasDataB && dataB && (
              <div>
                <div className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>{elementB.name}</span>
                </div>
                <div className="space-y-2 text-gray-600 pl-5">
                  <div className="flex justify-between">
                    <span>Segments trouvés:</span>
                    <span className="font-medium">{dataB.segments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps de calcul:</span>
                    <span className="font-medium">{dataB.queryTime}ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};