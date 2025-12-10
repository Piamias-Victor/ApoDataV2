// src/components/test/DailyMetricsTest.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useDailyMetrics } from '@/hooks/dashboard/useDailyMetrics';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { Card } from '@/components/atoms/Card/Card';

const DailyMetricsTest: React.FC = React.memo(() => {
  const [enabled, setEnabled] = useState(false);

  // Récupération des filtres du store (pattern existant)
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Hook daily metrics avec les filtres du store
  const {
    data,
    isLoading,
    error,
    isError,
    refetch,
    hasData,
    queryTime,
    cached
  } = useDailyMetrics({
    enabled,
    dateRange: analysisDateRange,
    productCodes: productsFilter,
    pharmacyId: pharmacyFilter.length > 0 ? pharmacyFilter[0] : undefined
  });

  const handleLoadData = () => {
    console.log('🎯 [Daily Metrics Test] Load data triggered', {
      analysisDateRange,
      productsFilter,
      pharmacyFilter
    });
    setEnabled(true);
  };

  const handleRefresh = async () => {
    console.log('🔄 [Daily Metrics Test] Manual refresh triggered');
    await refetch();
  };

  const handleReset = () => {
    setEnabled(false);
  };

  // Formatage des nombres
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Calculs de statistiques sur les données
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalCA = data.reduce((sum, entry) => sum + entry.ca_ttc_jour, 0);
    const totalQuantity = data.reduce((sum, entry) => sum + entry.quantite_vendue_jour, 0);
    const totalMarge = data.reduce((sum, entry) => sum + entry.marge_jour, 0);
    const avgDailyCA = totalCA / data.length;
    const finalCumul = data[data.length - 1];

    return {
      totalCA,
      totalQuantity,
      totalMarge,
      avgDailyCA,
      finalCumul,
      daysCount: data.length
    };
  }, [data]);

  // Log des résultats pour debug
  React.useEffect(() => {
    if (data && stats) {
      console.log('📊 [Daily Metrics Test] Data analysis:', {
        daysCount: stats.daysCount,
        totalCA: Math.round(stats.totalCA),
        avgDailyCA: Math.round(stats.avgDailyCA),
        queryTime,
        cached
      });
    }
  }, [data, stats, queryTime, cached]);

  return (
    <Card variant="elevated" className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Test Métriques Quotidiennes
        </h2>
        <p className="text-gray-600 text-sm">
          Utilise les filtres actuels du dashboard pour tester l'API daily-metrics
        </p>
      </div>

      {/* Filtres actuels du store */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Filtres actuels (depuis le store)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Période d'analyse:</span>
            <div className="font-medium text-gray-900">
              {analysisDateRange.start} → {analysisDateRange.end}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Produits sélectionnés:</span>
            <div className="font-medium text-gray-900">
              {productsFilter.length > 0 ? `${productsFilter.length} produits` : 'Tous les produits'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Pharmacie:</span>
            <div className="font-medium text-gray-900">
              {pharmacyFilter.length > 0 ? pharmacyFilter[0] : 'Toutes les pharmacies'}
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3">
        <button
          onClick={handleLoadData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {isLoading ? 'Chargement...' : 'Charger données'}
        </button>

        <button
          onClick={handleRefresh}
          disabled={isLoading || !hasData}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Actualiser
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset
        </button>
      </div>

      {/* États et résultats */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {hasData && !isLoading && stats && (
        <>
          {/* Statistiques résumées */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="text-green-400 mt-0.5">✅</div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  Données chargées avec succès
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-green-700">Période:</span>
                    <div className="font-medium text-green-800">{stats.daysCount} jours</div>
                  </div>
                  <div>
                    <span className="text-green-700">CA total:</span>
                    <div className="font-medium text-green-800">
                      {formatCurrency(stats.totalCA)}
                    </div>
                  </div>
                  <div>
                    <span className="text-green-700">CA moyen/jour:</span>
                    <div className="font-medium text-green-800">
                      {formatCurrency(stats.avgDailyCA)}
                    </div>
                  </div>
                  <div>
                    <span className="text-green-700">Performance:</span>
                    <div className="font-medium text-green-800">
                      {queryTime}ms {cached && '(cache)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des données détaillées */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-sm font-medium text-gray-900">
                Données quotidiennes détaillées
              </h3>
            </div>
            
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qté Vendue
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CA TTC
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marge
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumul CA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data && data.map((entry, index) => (
                    <tr key={entry.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {formatNumber(entry.quantite_vendue_jour)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(entry.ca_ttc_jour)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(entry.marge_jour)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {formatNumber(entry.stock_jour)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(entry.cumul_ca_ttc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Message si aucune donnée et pas d'erreur */}
      {enabled && !isLoading && !hasData && !isError && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <div className="text-gray-400 text-3xl mb-3">📊</div>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            Aucune donnée trouvée
          </h3>
          <p className="text-gray-600 text-sm">
            Aucune métrique quotidienne n'a été trouvée pour les filtres sélectionnés.
          </p>
        </div>
      )}
    </Card>
  );
});

DailyMetricsTest.displayName = 'DailyMetricsTest';

export default DailyMetricsTest;