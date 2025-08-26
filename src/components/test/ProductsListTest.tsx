// src/components/test/ProductsListTest.tsx
'use client';

import React, { useState } from 'react';
import { useProductsList, useFormattedProductMetrics } from '@/hooks/products/useProductsList';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';

interface ProductsListTestProps {
  readonly className?: string;
}

/**
 * Composant de test pour la liste des produits
 * À placer temporairement sur le dashboard pour valider l'API
 */
export const ProductsListTest: React.FC<ProductsListTestProps> = ({ 
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Hook pour récupérer les produits
  const { 
    products, 
    isLoading, 
    error, 
    queryTime, 
    cached, 
    count, 
    refetch,
    hasData 
  } = useProductsList({ enabled: true });

  // Selectors individuels pour éviter la recreation d'objets
  const dateRangeStart = useFiltersStore(state => state.analysisDateRange.start);
  const dateRangeEnd = useFiltersStore(state => state.analysisDateRange.end);
  const productsCount = useFiltersStore(state => state.products.length);
  const laboratoriesCount = useFiltersStore(state => state.laboratories.length);
  const categoriesCount = useFiltersStore(state => state.categories.length);
  const pharmacyCount = useFiltersStore(state => state.pharmacy.length);

  // Quick test: définir des filtres de base s'ils sont vides
  const setTestFilters = () => {
    const store = useFiltersStore.getState();
    
    // Test avec période récente
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3); // 3 mois

    store.setAnalysisDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Ajouter quelques codes produits de test (à adapter selon tes données)
    store.setProductFilters(['3401579804858', '3401560009927', '3401597940019']);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Test API Products List
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Validation de l'API avec cache Upstash 12h
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={setTestFilters}
            >
              Filtres Test
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Métriques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Produits</p>
            <p className="text-lg font-bold text-blue-900">{count}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Query Time</p>
            <p className="text-lg font-bold text-green-900">{queryTime}ms</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">Cache</p>
            <Badge variant={cached ? "success" : "secondary"}>
              {cached ? "HIT" : "MISS"}
            </Badge>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-xs text-orange-600 font-medium">Status</p>
            <Badge variant={error ? "danger" : hasData ? "success" : "secondary"}>
              {error ? "ERROR" : hasData ? "OK" : "NO DATA"}
            </Badge>
          </div>
        </div>

        {/* Debug filtres */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <span>Filtres Actuels</span>
            <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showDetails && (
            <div className="space-y-2 text-xs text-gray-600">
              <p><strong>Dates:</strong> {dateRangeStart || 'non définie'} → {dateRangeEnd || 'non définie'}</p>
              <p><strong>Produits:</strong> {productsCount} codes</p>
              <p><strong>Labos:</strong> {laboratoriesCount} codes</p>
              <p><strong>Catégories:</strong> {categoriesCount} codes</p>
              <p><strong>Pharmacies:</strong> {pharmacyCount} sélectionnées</p>
            </div>
          )}
        </div>

        {/* Gestion des états */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Erreur API</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Aperçu des produits */}
        {hasData && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Top {Math.min(5, products.length)} Produits (sur {count})
            </h4>
            
            <div className="space-y-3">
              {products.slice(0, 5).map((product, index) => (
                <ProductRow key={product.code_ean} product={product} rank={index + 1} />
              ))}
            </div>
            
            {products.length > 5 && (
              <p className="text-sm text-gray-500 text-center py-2">
                ... et {products.length - 5} autres produits
              </p>
            )}
          </div>
        )}

        {/* Message si pas de données */}
        {!hasData && !isLoading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune donnée disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              Vérifiez vos filtres ou utilisez "Filtres Test"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Composant pour afficher une ligne produit - memoized pour performance
const ProductRow = React.memo<{ 
  product: any; 
  rank: number; 
}>(({ product, rank }) => {
  const formatted = useFormattedProductMetrics(product);
  
  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">#{rank}</span>
          <span className="font-medium text-gray-900 truncate max-w-xs">
            {product.product_name}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          EAN: {product.code_ean}
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-right">
        <div>
          <p className="text-xs text-gray-500">CA TTC</p>
          <p className="text-sm font-medium">{formatted.caTTC}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Marge</p>
          <p className="text-sm font-medium">{formatted.marginRate}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Stock</p>
          <p className="text-sm font-medium">{formatted.currentStock}</p>
        </div>
      </div>
    </div>
  );
});

ProductRow.displayName = 'ProductRow';