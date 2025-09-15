// src/components/organisms/ComparisonKpisSection/ComparisonKpisSection.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw, AlertCircle, ArrowLeftRight, TrendingUp, Eye, BarChart3 } from 'lucide-react';
import { useComparisonKpis } from '@/hooks/dashboard/useComparisonKpis';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { ComparisonKpiCard } from '@/components/molecules/ComparisonKpiCard/ComparisonKpiCard';

interface ComparisonKpisSectionProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

export const ComparisonKpisSection: React.FC<ComparisonKpisSectionProps> = ({
  className = '',
  onRefresh
}) => {
  const { elementA, elementB, elementC } = useComparisonStore();

  const { 
    dataA, 
    dataB, 
    dataC,
    isLoading, 
    error, 
    refetch,
    selectedCount
  } = useComparisonKpis({
    enabled: true,
    elementA,
    elementB,
    elementC
  });

  const kpiGroups = useMemo(() => ({
    performance: [
      {
        key: 'ca_ttc',
        title: 'Chiffre d\'affaires TTC',
        unit: 'currency' as const,
        priority: 1
      },
      {
        key: 'montant_marge',
        title: 'Montant marge',
        unit: 'currency' as const,
        priority: 1
      },
      {
        key: 'pourcentage_marge',
        title: 'Taux de marge',
        unit: 'percentage' as const,
        priority: 1
      }
    ],
    volumes: [
      {
        key: 'quantite_vendue',
        title: 'Quantité vendue',
        unit: 'number' as const,
        priority: 2
      },
      {
        key: 'quantite_achetee',
        title: 'Quantité achetée',
        unit: 'number' as const,
        priority: 2
      },
      {
        key: 'montant_achat_ht',
        title: 'Montant achat HT',
        unit: 'currency' as const,
        priority: 2
      }
    ],
    stock: [
      {
        key: 'valeur_stock_ht',
        title: 'Valeur stock HT',
        unit: 'currency' as const,
        priority: 3
      },
      {
        key: 'quantite_stock',
        title: 'Quantité stock',
        unit: 'number' as const,
        priority: 3
      },
      {
        key: 'jours_de_stock',
        title: 'Jours de stock',
        unit: 'days' as const,
        priority: 3
      },
      {
        key: 'nb_references_produits',
        title: 'Nb références',
        unit: 'number' as const,
        priority: 3
      }
    ]
  }), []);

  // Calcul simplifié du résumé de performance
  const performanceSummary = useMemo(() => {
    // Vérification explicite des données avant traitement
    if (!dataA || !dataB || !elementA || !elementB) {
      return null;
    }

    // Calcul simplifié avec des valeurs connues non-undefined
    const caA = (dataA.ca_ttc as number) || 0;
    const caB = (dataB.ca_ttc as number) || 0;
    const caC = dataC ? ((dataC.ca_ttc as number) || 0) : 0;

    const margeA = (dataA.montant_marge as number) || 0;
    const margeB = (dataB.montant_marge as number) || 0;
    const margeC = dataC ? ((dataC.montant_marge as number) || 0) : 0;

    const qteA = (dataA.quantite_vendue as number) || 0;
    const qteB = (dataB.quantite_vendue as number) || 0;
    const qteC = dataC ? ((dataC.quantite_vendue as number) || 0) : 0;

    // Calcul des scores
    let scoreA = 0;
    let scoreB = 0; 
    let scoreC = 0;

    // CA
    const maxCA = Math.max(caA, caB, caC);
    if (maxCA > 0) {
      if (caA === maxCA) scoreA++;
      if (caB === maxCA) scoreB++;
      if (caC === maxCA && dataC) scoreC++;
    }

    // Marge
    const maxMarge = Math.max(margeA, margeB, margeC);
    if (maxMarge > 0) {
      if (margeA === maxMarge) scoreA++;
      if (margeB === maxMarge) scoreB++;
      if (margeC === maxMarge && dataC) scoreC++;
    }

    // Quantité
    const maxQte = Math.max(qteA, qteB, qteC);
    if (maxQte > 0) {
      if (qteA === maxQte) scoreA++;
      if (qteB === maxQte) scoreB++;
      if (qteC === maxQte && dataC) scoreC++;
    }

    // Déterminer le gagnant
    const maxScore = Math.max(scoreA, scoreB, scoreC);
    let bestPerformer = null;

    if (maxScore > 0) {
      if (scoreA === maxScore) {
        bestPerformer = { element: elementA, key: 'A', score: scoreA };
      } else if (scoreB === maxScore) {
        bestPerformer = { element: elementB, key: 'B', score: scoreB };
      } else if (scoreC === maxScore && elementC) {
        bestPerformer = { element: elementC, key: 'C', score: scoreC };
      }
    }

    return {
      bestPerformer,
      isTie: scoreA === scoreB && (!dataC || scoreB === scoreC)
    };
  }, [dataA, dataB, dataC, elementA, elementB, elementC]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  if (selectedCount === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse comparative
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Comparez les performances de vos produits, laboratoires ou catégories
            </p>
          </div>
        </div>

        <Card variant="interactive" padding="xl" className="text-center">
          <div className="py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Prêt à comparer ?
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Sélectionnez 2 ou 3 éléments ci-dessus pour découvrir leurs métriques 
              côte à côte et identifier les meilleures performances.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedCount === 1) {
    const selectedElement = elementA || elementB || elementC;
    const position = elementA ? 'A' : elementB ? 'B' : 'C';

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyse comparative
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
              Ajoutez au moins un autre élément pour commencer l'analyse comparative
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${
                position === 'A' ? 'bg-blue-500' : 
                position === 'B' ? 'bg-purple-500' : 
                'bg-green-500'
              }`}></span>
              <span className="text-sm font-medium text-gray-700">{selectedElement?.name}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analyse comparative ({selectedCount} éléments)
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
                  <ArrowLeftRight className="w-4 h-4 text-gray-400" />
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
                  <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {elementC.name}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {performanceSummary && !isLoading && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-600">
                  {performanceSummary.bestPerformer ? 
                    `${performanceSummary.bestPerformer.element?.name} en tête` :
                    'Performance équivalente'
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
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

      {error && (
        <Card variant="outlined" padding="md" className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Erreur de chargement des données
              </p>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span>Performance commerciale</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiGroups.performance.map(config => (
            <ComparisonKpiCard
              key={config.key}
              title={config.title}
              unit={config.unit}
              valueA={dataA?.[config.key as keyof typeof dataA] as number || 0}
              valueB={dataB?.[config.key as keyof typeof dataB] as number || 0}
              valueC={dataC ? (dataC[config.key as keyof typeof dataC] as number) : undefined}
              elementAName={elementA?.name || undefined}
              elementBName={elementB?.name || undefined}
              elementCName={elementC?.name || undefined}
              loading={isLoading}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>Volumes et achats</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiGroups.volumes.map(config => (
            <ComparisonKpiCard
              key={config.key}
              title={config.title}
              unit={config.unit}
              valueA={dataA?.[config.key as keyof typeof dataA] as number || 0}
              valueB={dataB?.[config.key as keyof typeof dataB] as number || 0}
              valueC={dataC ? (dataC[config.key as keyof typeof dataC] as number) : undefined}
              elementAName={elementA?.name || undefined}
              elementBName={elementB?.name || undefined}
              elementCName={elementC?.name || undefined}
              loading={isLoading}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <div className="w-5 h-5 bg-amber-500 rounded-sm"></div>
          <span>Gestion des stocks</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiGroups.stock.map(config => (
            <ComparisonKpiCard
              key={config.key}
              title={config.title}
              unit={config.unit}
              valueA={dataA?.[config.key as keyof typeof dataA] as number || 0}
              valueB={dataB?.[config.key as keyof typeof dataB] as number || 0}
              valueC={dataC ? (dataC[config.key as keyof typeof dataC] as number) : undefined}
              elementAName={elementA?.name || undefined}
              elementBName={elementB?.name || undefined}
              elementCName={elementC?.name || undefined}
              loading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};