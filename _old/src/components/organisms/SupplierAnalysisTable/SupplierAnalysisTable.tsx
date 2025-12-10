// src/components/organisms/SupplierAnalysisTable/SupplierAnalysisTable.tsx
'use client';

import React from 'react';
import { TrendingUp, Package, ShoppingCart, Database } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { useSupplierAnalysis } from '@/hooks/suppliers/useSupplierAnalysis';

interface SupplierAnalysisTableProps {
  readonly dateRange: { start: string; end: string };
  readonly productCodes?: string[];
  readonly className?: string;
}

export const SupplierAnalysisTable: React.FC<SupplierAnalysisTableProps> = ({
  dateRange,
  productCodes = [],
  className = ''
}) => {
  const { data: suppliers, total, isLoading, error } = useSupplierAnalysis({
    enabled: true,
    dateRange,
    productCodes
  });

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K €`;
    return `${value.toFixed(2)} €`;
  };

  const getSupplierColor = (category: string) => {
    switch (category) {
      case 'OCP': return 'bg-blue-50 text-blue-700';
      case 'ALLIANCE': return 'bg-green-50 text-green-700';
      case 'CERP': return 'bg-purple-50 text-purple-700';
      case 'AUTRE': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const calculatePercentage = (value: number, totalValue: number) => {
    if (totalValue === 0) return 0;
    return ((value / totalValue) * 100).toFixed(1);
  };

  if (error) {
    return (
      <Card variant="elevated" className={`p-6 text-center ${className}`}>
        <p className="text-red-600">❌ {error}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="elevated" className={`p-12 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Chargement de l'analyse fournisseurs...</span>
        </div>
      </Card>
    );
  }

  if (suppliers.length === 0) {
    return (
      <Card variant="elevated" className={`p-12 ${className}`}>
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Database className="w-12 h-12 text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune donnée disponible
            </h3>
            <p className="text-sm text-gray-600">
              Aucun achat trouvé pour la période sélectionnée
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Analyse par Fournisseur
        </h2>
        <div className="text-sm text-gray-500">
          {suppliers.length} catégorie{suppliers.length > 1 ? 's' : ''}
        </div>
      </div>

      <Card variant="elevated" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Commandes</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1">
                    <Package className="w-4 h-4" />
                    <span>Volume Acheté</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>CA Achats</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1">
                    <Database className="w-4 h-4" />
                    <span>Produits Distincts</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {suppliers.map((supplier, index) => (
                <tr 
                  key={supplier.supplier_category}
                  className={`transition-colors ${
                    index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-25 hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-lg ${getSupplierColor(supplier.supplier_category)}`}>
                        {supplier.supplier_category}
                      </span>
                      {total && (
                        <span className="text-xs text-gray-500">
                          {calculatePercentage(supplier.ca_achats, total.ca_achats)}% du CA
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(supplier.nb_commandes)}
                    </div>
                    {total && (
                      <div className="text-xs text-gray-500">
                        {calculatePercentage(supplier.nb_commandes, total.nb_commandes)}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(supplier.quantity_bought)}
                    </div>
                    {total && (
                      <div className="text-xs text-gray-500">
                        {calculatePercentage(supplier.quantity_bought, total.quantity_bought)}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(supplier.ca_achats)}
                    </div>
                    {total && (
                      <div className="text-xs text-gray-500">
                        {calculatePercentage(supplier.ca_achats, total.ca_achats)}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(supplier.nb_produits_distincts)}
                    </div>
                  </td>
                </tr>
              ))}

              {total && (
                <tr className="bg-blue-50 font-semibold">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatNumber(total.nb_commandes)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatNumber(total.quantity_bought)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(total.ca_achats)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatNumber(total.nb_produits_distincts)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};