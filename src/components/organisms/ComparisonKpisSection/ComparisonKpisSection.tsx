// src/components/organisms/ComparisonKpisSection/ComparisonKpisSection.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { RotateCcw, AlertCircle, ArrowLeftRight, TrendingUp, Eye, BarChart3 } from 'lucide-react';
import { useComparisonKpis } from '@/hooks/dashboard/useComparisonKpis';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import { ComparisonKpiCard } from '@/components/molecules/ComparisonKpiCard/ComparisonKpiCard';
import { CsvExporter } from '@/utils/export/csvExporter';

interface ComparisonKpisSectionProps {
  readonly className?: string;
  readonly onRefresh?: () => void;
}

/**
 * ComparisonKpisSection - Layout intuitif amélioré avec Export CSV
 * 
 * Améliorations UX :
 * - Grille adaptative 2-3 colonnes selon écran
 * - KPI groupés par importance (CA/Marge, Volumes, Stock)
 * - Header plus expressif avec résumé performance
 * - États vides plus engageants
 * - Loading states optimisés
 * - Export CSV comparatif intégré
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

  // Hook export CSV
  const { exportToCsv, isExporting } = useExportCsv();

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

  // Préparation données pour export CSV comparatif
  const prepareComparisonDataForExport = useCallback(() => {
    if (!dataA || !dataB || !elementA || !elementB) return [];
    
    const exportData = [];
    
    // En-tête avec informations générales
    exportData.push({
      'Type Comparaison': 'ANALYSE COMPARATIVE',
      'Élément A': elementA.name,
      'Type A': elementA.type,
      'Élément B': elementB.name,
      'Type B': elementB.type,
      'Date Export': new Date().toLocaleDateString('fr-FR'),
      'Heure Export': new Date().toLocaleTimeString('fr-FR'),
      'Performance Globale': performanceSummary?.overallWinner === 'A' ? `${elementA.name} devance` : 
                           performanceSummary?.overallWinner === 'B' ? `${elementB.name} devance` : 
                           'Performance équivalente',
      'Score A': performanceSummary?.scoreA.toString() || '0',
      'Score B': performanceSummary?.scoreB.toString() || '0',
      'KPI': '',
      'Valeur A': '',
      'Valeur B': '',
      'Écart Absolu': '',
      'Écart Relatif (%)': '',
      'Gagnant': '',
      'Unité': '',
      'Catégorie': ''
    });

    // Ligne de séparation
    exportData.push({
      'Type Comparaison': '--- DÉTAIL KPI PAR CATÉGORIE ---',
      'Élément A': '',
      'Type A': '',
      'Élément B': '',
      'Type B': '',
      'Date Export': '',
      'Heure Export': '',
      'Performance Globale': '',
      'Score A': '',
      'Score B': '',
      'KPI': '',
      'Valeur A': '',
      'Valeur B': '',
      'Écart Absolu': '',
      'Écart Relatif (%)': '',
      'Gagnant': '',
      'Unité': '',
      'Catégorie': ''
    });

    // Export par catégorie avec calculs d'écarts
    const allKpis = [
      ...kpiGroups.performance.map(kpi => ({ ...kpi, category: 'Performance commerciale' })),
      ...kpiGroups.volumes.map(kpi => ({ ...kpi, category: 'Volumes et achats' })),
      ...kpiGroups.stock.map(kpi => ({ ...kpi, category: 'Gestion des stocks' }))
    ];

    allKpis.forEach(kpiConfig => {
      const valueA = (dataA[kpiConfig.key as keyof typeof dataA] as number) || 0;
      const valueB = (dataB[kpiConfig.key as keyof typeof dataB] as number) || 0;
      const ecartAbsolu = valueB - valueA;
      const ecartRelatif = valueA !== 0 ? ((ecartAbsolu / valueA) * 100) : 0;
      const gagnant = valueB > valueA ? elementB.name : valueA > valueB ? elementA.name : 'Égalité';

      exportData.push({
        'Type Comparaison': 'COMPARAISON KPI',
        'Élément A': elementA.name,
        'Type A': elementA.type,
        'Élément B': elementB.name,
        'Type B': elementB.type,
        'Date Export': new Date().toLocaleDateString('fr-FR'),
        'Heure Export': new Date().toLocaleTimeString('fr-FR'),
        'Performance Globale': performanceSummary?.overallWinner === 'A' ? `${elementA.name} devance` : 
                             performanceSummary?.overallWinner === 'B' ? `${elementB.name} devance` : 
                             'Performance équivalente',
        'Score A': performanceSummary?.scoreA.toString() || '0',
        'Score B': performanceSummary?.scoreB.toString() || '0',
        'KPI': kpiConfig.title,
        'Valeur A': kpiConfig.unit === 'currency' ? valueA.toFixed(2) :
                   kpiConfig.unit === 'percentage' ? valueA.toFixed(2) :
                   kpiConfig.unit === 'days' ? valueA.toFixed(1) :
                   valueA.toString(),
        'Valeur B': kpiConfig.unit === 'currency' ? valueB.toFixed(2) :
                   kpiConfig.unit === 'percentage' ? valueB.toFixed(2) :
                   kpiConfig.unit === 'days' ? valueB.toFixed(1) :
                   valueB.toString(),
        'Écart Absolu': kpiConfig.unit === 'currency' ? ecartAbsolu.toFixed(2) :
                       kpiConfig.unit === 'percentage' ? ecartAbsolu.toFixed(2) :
                       kpiConfig.unit === 'days' ? ecartAbsolu.toFixed(1) :
                       ecartAbsolu.toString(),
        'Écart Relatif (%)': ecartRelatif.toFixed(2),
        'Gagnant': gagnant,
        'Unité': kpiConfig.unit === 'currency' ? 'EUR' :
                 kpiConfig.unit === 'percentage' ? '%' :
                 kpiConfig.unit === 'days' ? 'jours' :
                 kpiConfig.unit === 'number' ? 'unités' : '',
        'Catégorie': kpiConfig.category
      });
    });

    // Section résumé technique
    exportData.push({
      'Type Comparaison': '--- RÉSUMÉ TECHNIQUE ---',
      'Élément A': '',
      'Type A': '',
      'Élément B': '',
      'Type B': '',
      'Date Export': '',
      'Heure Export': '',
      'Performance Globale': '',
      'Score A': '',
      'Score B': '',
      'KPI': '',
      'Valeur A': '',
      'Valeur B': '',
      'Écart Absolu': '',
      'Écart Relatif (%)': '',
      'Gagnant': '',
      'Unité': '',
      'Catégorie': ''
    });

    exportData.push({
      'Type Comparaison': 'MÉTADONNÉES',
      'Élément A': elementA.name,
      'Type A': elementA.type,
      'Élément B': elementB.name,
      'Type B': elementB.type,
      'Date Export': new Date().toLocaleDateString('fr-FR'),
      'Heure Export': new Date().toLocaleTimeString('fr-FR'),
      'Performance Globale': performanceSummary?.overallWinner === 'A' ? `${elementA.name} devance` : 
                           performanceSummary?.overallWinner === 'B' ? `${elementB.name} devance` : 
                           'Performance équivalente',
      'Score A': performanceSummary?.scoreA.toString() || '0',
      'Score B': performanceSummary?.scoreB.toString() || '0',
      'KPI': 'Pharmacies concernées A',
      'Valeur A': dataA.nb_pharmacies?.toString() || '0',
      'Valeur B': dataB.nb_pharmacies?.toString() || '0',
      'Écart Absolu': ((dataB.nb_pharmacies || 0) - (dataA.nb_pharmacies || 0)).toString(),
      'Écart Relatif (%)': dataA.nb_pharmacies ? (((dataB.nb_pharmacies || 0) - (dataA.nb_pharmacies || 0)) / (dataA.nb_pharmacies || 1) * 100).toFixed(2) : '0',
      'Gagnant': (dataB.nb_pharmacies || 0) > (dataA.nb_pharmacies || 0) ? elementB.name : (dataA.nb_pharmacies || 0) > (dataB.nb_pharmacies || 0) ? elementA.name : 'Égalité',
      'Unité': 'pharmacies',
      'Catégorie': 'Technique'
    });

    return exportData;
  }, [dataA, dataB, elementA, elementB, performanceSummary, kpiGroups]);

  // Handler export avec vérification
  const handleExport = useCallback(() => {
    const exportData = prepareComparisonDataForExport();
    
    if (exportData.length === 0) {
      console.warn('Aucune donnée de comparaison à exporter');
      return;
    }
    
    // Nom de fichier intelligent avec éléments comparés
    const elementASlug = elementA?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'elementA';
    const elementBSlug = elementB?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'elementB';
    const filename = CsvExporter.generateFilename(`apodata_comparaison_${elementASlug}_vs_${elementBSlug}`);
    
    // Vérification que le premier élément existe avant d'obtenir les headers
    if (!exportData[0]) {
      console.error('Données export comparaison invalides');
      return;
    }
    
    const headers = Object.keys(exportData[0]);
    
    exportToCsv({
      filename,
      headers,
      data: exportData
    });
  }, [prepareComparisonDataForExport, exportToCsv, elementA, elementB]);

  // Handler refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

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
      {/* Header avec résumé performance et export */}
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

        {/* Boutons d'action */}
        <div className="flex items-center space-x-2">
          <ExportButton
            onClick={handleExport}
            isExporting={isExporting}
            disabled={!hasDataA || !hasDataB || isLoading}
            label="Export CSV"
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
    </div>
  );
};