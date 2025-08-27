// src/components/test/KpiTestComponent.tsx
'use client';

import React, { useState } from 'react';
import { useKpiMetrics } from '@/hooks/dashboard/useKpiMetrics';

const KpiTestComponent: React.FC = () => {
  // États des filtres - changent automatiquement le hook
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01T00:00:00Z',
    end: '2024-12-31T23:59:59Z'
  });

  const [includeComparison, setIncludeComparison] = useState(false);
  const [comparisonDateRange, setComparisonDateRange] = useState({
    start: '2023-01-01T00:00:00Z',
    end: '2023-12-31T23:59:59Z'
  });

  const [productFilters, setProductFilters] = useState<string[]>([]);

  // Hook se relance automatiquement quand les états changent
  const { data, isLoading, error, queryTime, cached, hasData, refetch } = useKpiMetrics({
    enabled: true,
    includeComparison,
    dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined,
    filters: {
      products: productFilters,
      laboratories: [],
      categories: [],
      pharmacies: []
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test KPI Hook - Auto-Refresh</h1>
      
      {/* Panel de contrôles */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtres (Auto-Refresh)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Période d'analyse</label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRange.start.split('T')[0]}
                onChange={(e) => {
                  const newRange = { ...dateRange, start: `${e.target.value}T00:00:00Z` };
                  console.log('📅 Date start changed:', newRange);
                  setDateRange(newRange);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="date"
                value={dateRange.end.split('T')[0]}
                onChange={(e) => {
                  const newRange = { ...dateRange, end: `${e.target.value}T23:59:59Z` };
                  console.log('📅 Date end changed:', newRange);
                  setDateRange(newRange);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Comparaison */}
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="comparison"
                checked={includeComparison}
                onChange={(e) => {
                  console.log('🔄 Comparison toggled:', e.target.checked);
                  setIncludeComparison(e.target.checked);
                }}
                className="mr-2"
              />
              <label htmlFor="comparison" className="text-sm font-medium">
                Inclure comparaison
              </label>
            </div>
            
            {includeComparison && (
              <div className="space-y-2">
                <input
                  type="date"
                  value={comparisonDateRange.start.split('T')[0]}
                  onChange={(e) => {
                    const newRange = { ...comparisonDateRange, start: `${e.target.value}T00:00:00Z` };
                    console.log('📅 Comparison start changed:', newRange);
                    setComparisonDateRange(newRange);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={comparisonDateRange.end.split('T')[0]}
                  onChange={(e) => {
                    const newRange = { ...comparisonDateRange, end: `${e.target.value}T23:59:59Z` };
                    console.log('📅 Comparison end changed:', newRange);
                    setComparisonDateRange(newRange);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Test Filtres Produits */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Test Filtres Produits</label>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const newFilters = ['3662361001866'];
                console.log('🏷️ Product filters changed:', newFilters);
                setProductFilters(newFilters);
              }}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Ajouter Produit Test
            </button>
            <button
              onClick={() => {
                console.log('🗑️ Product filters cleared');
                setProductFilters([]);
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Clear Filtres
            </button>
          </div>
          {productFilters.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Filtres actifs: {productFilters.join(', ')}
            </p>
          )}
        </div>

        {/* Bouton refresh manuel */}
        <button 
          onClick={() => {
            console.log('🔄 Manual refetch triggered');
            refetch();
          }}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? '⏳ Chargement...' : '🔄 Refresh Manuel'}
        </button>
      </div>
      
      {/* Statut */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">📊 Statut API</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="font-medium">Loading:</span>
            <span className={`ml-1 ${isLoading ? 'text-yellow-600' : 'text-gray-600'}`}>
              {isLoading ? '⏳ Oui' : '✅ Non'}
            </span>
          </div>
          <div>
            <span className="font-medium">Has Data:</span>
            <span className={`ml-1 ${hasData ? 'text-green-600' : 'text-gray-600'}`}>
              {hasData ? '✅ Oui' : '❌ Non'}
            </span>
          </div>
          <div>
            <span className="font-medium">Error:</span>
            <span className={`ml-1 ${error ? 'text-red-600' : 'text-gray-600'}`}>
              {error ? '🚨 Oui' : '✅ Non'}
            </span>
          </div>
          <div>
            <span className="font-medium">Time:</span>
            <span className="ml-1 text-gray-600">{queryTime}ms</span>
          </div>
          <div>
            <span className="font-medium">Cached:</span>
            <span className={`ml-1 ${cached ? 'text-blue-600' : 'text-gray-600'}`}>
              {cached ? '💾 Oui' : '🔄 Non'}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
            <strong>❌ Erreur:</strong> {error}
          </div>
        )}
      </div>

      {/* Résultats KPI */}
      {data && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📈 Résultats KPI</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-sm text-blue-600 font-medium">CA TTC</div>
              <div className="text-lg font-bold text-blue-900">
                {data.ca_ttc.toLocaleString('fr-FR')}€
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-sm text-green-600 font-medium">Marge</div>
              <div className="text-lg font-bold text-green-900">
                {data.montant_marge.toLocaleString('fr-FR')}€
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-sm text-purple-600 font-medium">Marge %</div>
              <div className="text-lg font-bold text-purple-900">
                {data.pourcentage_marge.toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-sm text-orange-600 font-medium">Stock</div>
              <div className="text-lg font-bold text-orange-900">
                {data.valeur_stock_ht.toLocaleString('fr-FR')}€
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Qté Vendue:</strong> {data.quantite_vendue.toLocaleString('fr-FR')}
            </div>
            <div>
              <strong>Qté Stock:</strong> {data.quantite_stock.toLocaleString('fr-FR')}
            </div>
            <div>
              <strong>Jours Stock:</strong> {data.jours_de_stock || 'N/A'}
            </div>
            <div>
              <strong>Références:</strong> {data.nb_references_produits.toLocaleString('fr-FR')}
            </div>
            <div>
              <strong>Pharmacies:</strong> {data.nb_pharmacies.toLocaleString('fr-FR')}
            </div>
          </div>

          {/* Comparaison si disponible */}
          {data.comparison && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">📊 Comparaison Période</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>CA TTC:</strong> {data.comparison.ca_ttc.toLocaleString('fr-FR')}€
                  <div className="text-xs text-gray-500">
                    Évol: {((data.ca_ttc - data.comparison.ca_ttc) / data.comparison.ca_ttc * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <strong>Marge:</strong> {data.comparison.montant_marge.toLocaleString('fr-FR')}€
                  <div className="text-xs text-gray-500">
                    Évol: {((data.montant_marge - data.comparison.montant_marge) / data.comparison.montant_marge * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <strong>Qté:</strong> {data.comparison.quantite_vendue.toLocaleString('fr-FR')}
                  <div className="text-xs text-gray-500">
                    Évol: {((data.quantite_vendue - data.comparison.quantite_vendue) / data.comparison.quantite_vendue * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiTestComponent;