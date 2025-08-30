// src/components/organisms/ComparisonKpisSection/ComparisonKpisSection.tsx
'use client';

import React, { useMemo } from 'react';
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

/**
 * ComparisonKpisSection - Layout intuitif amélioré
 * 
 * Améliorations UX :
 * - Grille adaptative 2-3 colonnes selon écran
 * - KPI groupés par importance (CA/Marge, Volumes, Stock)
 * - Header plus expressif avec résumé performance
 * - États vides plus engageants
 * - Loading states optimisés
 * - Micro-animations fluides
 */
export const ComparisonKpisSection: React.FC<ComparisonKpisSectionProps> = ({
  className = '',
  onRefresh
}) => {
  // Store comparison pour les éléments sélectionnés
  const { elementA, elementB } = useComparisonStore();

  // Hook KPI comparaison
  const { 
    dataA, 
    dataB, 
    isLoading, 
    error, 
    refetch,
    hasDataA,
    hasDataB
  } = useComparisonKpis({
    enabled: true,
    elementA,
    elementB
  });

  // Configuration KPIs groupés par importance
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

  // Calcul du résumé de performance
  const performanceSummary = useMemo(() => {
    if (!dataA || !dataB) return null;

    const caWinner = dataB.ca_ttc > dataA.ca_ttc ? 'B' : dataA.ca_ttc > dataB.ca_ttc ? 'A' : 'tie';
    const margeWinner = dataB.montant_marge > dataA.montant_marge ? 'B' : dataA.montant_marge > dataB.montant_marge ? 'A' : 'tie';
    const volumeWinner = dataB.quantite_vendue > dataA.quantite_vendue ? 'B' : dataA.quantite_vendue > dataB.quantite_vendue ? 'A' : 'tie';

    let overallWinner = 'tie';
    const scoreA = (caWinner === 'A' ? 1 : 0) + (margeWinner === 'A' ? 1 : 0) + (volumeWinner === 'A' ? 1 : 0);
    const scoreB = (caWinner === 'B' ? 1 : 0) + (margeWinner === 'B' ? 1 : 0) + (volumeWinner === 'B' ? 1 : 0);
    
    if (scoreA > scoreB) overallWinner = 'A';
    else if (scoreB > scoreA) overallWinner = 'B';

    return { caWinner, margeWinner, volumeWinner, overallWinner, scoreA, scoreB };
  }, [dataA, dataB]);

  // Handler refresh
  const handleRefresh = async () => {
    await refetch();
    onRefresh?.();
  };

  // État aucun élément sélectionné
  if (!elementA && !elementB) {
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
              Sélectionnez deux éléments ci-dessus pour découvrir leurs métriques 
              côte à côte et identifier les meilleures performances.
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
              Ajoutez un élément {missing} pour commencer l'analyse comparative
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
      {/* Header avec résumé performance */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analyse comparative
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
            
            {performanceSummary && !isLoading && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-600">
                  {performanceSummary.overallWinner === 'A' ? `${elementA.name} devance` :
                   performanceSummary.overallWinner === 'B' ? `${elementB.name} devance` :
                   'Performance équivalente'}
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
                Erreur de chargement des données
              </p>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* KPI Performance - Priorité 1 */}
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
              elementAName={elementA.name}
              elementBName={elementB.name}
              loading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* KPI Volumes - Priorité 2 */}
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
              elementAName={elementA.name}
              elementBName={elementB.name}
              loading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* KPI Stock - Priorité 3 */}
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
              elementAName={elementA.name}
              elementBName={elementB.name}
              loading={isLoading}
            />
          ))}
        </div>
      </div>

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
                    <span>Pharmacies concernées:</span>
                    <span className="font-medium">{dataA.nb_pharmacies}</span>
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
                    <span>Pharmacies concernées:</span>
                    <span className="font-medium">{dataB.nb_pharmacies}</span>
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