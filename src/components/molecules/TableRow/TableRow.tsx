// src/components/molecules/TableRow/TableRow.tsx
import React from 'react';
import type { ProductMetrics, ViewMode } from '../../organisms/ProductsTable/types';

interface TableRowProps {
  readonly product: ProductMetrics;
  readonly viewMode: ViewMode;
  readonly isEven: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  product,
  viewMode,
  isEven
}) => {
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getMarginColorClass = (margin: number): string => {
    if (margin >= 30) return 'text-green-700 bg-green-50';
    if (margin >= 20) return 'text-blue-700 bg-blue-50';
    if (margin >= 10) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  // Calcul des métriques dérivées pour mode "totals"
  const avgSellPriceTtc = product.quantity_sold > 0 && product.ca_ttc > 0
    ? product.ca_ttc / product.quantity_sold
    : 0;

  const stockDays = product.current_stock > 0 && product.quantity_sold > 0
    ? (product.current_stock / product.quantity_sold) * 30
    : 0;

  // Calcul rotation stock pour mode "averages"
  const stockRotationDays = product.current_stock > 0 && product.quantity_sold > 0
    ? (product.current_stock / product.quantity_sold) * 30
    : 0;

  // Fonction de rendu de l'évolution (copiée de SalesTable)
  const renderEvolution = () => {
    if (product.quantity_sold_comparison === null || product.quantity_sold_comparison === undefined) {
      return <span className="text-xs text-gray-400">N/A</span>;
    }
    
    if (product.quantity_sold_comparison === 0) {
      return <span className="text-xs font-semibold text-blue-600">Nouveau</span>;
    }
    
    const evolution = ((product.quantity_sold - product.quantity_sold_comparison) / product.quantity_sold_comparison) * 100;
    const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-700';
    
    return (
      <span className={`text-sm font-semibold ${colorClass}`}>
        {evolution > 0 ? '+' : ''}{evolution.toFixed(1)}%
      </span>
    );
  };

  return (
    <tr className={`${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
      {/* Produit */}
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={product.product_name}>
          {product.product_name}
        </div>
      </td>

      {/* Code EAN */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-600 font-mono">
          {product.code_ean}
        </div>
      </td>

      {/* Laboratoire */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-700">
          {product.bcb_lab || '-'}
        </div>
      </td>

      {viewMode === 'totals' ? (
        <>
          {/* CA TTC */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(product.ca_ttc)}
            </div>
          </td>

          {/* Quantité vendue */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatNumber(product.quantity_sold)}
            </div>
          </td>

          {/* NOUVELLE CELLULE: Évolution */}
          <td className="px-4 py-3 text-right">
            {renderEvolution()}
          </td>

          {/* Montant achat */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-900">
              {formatCurrency(product.purchase_amount)}
            </div>
          </td>

          {/* Stock actuel */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-900">
              {formatNumber(product.current_stock)}
            </div>
          </td>

          {/* Marge totale HT */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(product.total_margin_ht)}
            </div>
          </td>

          {/* Taux de marge */}
          <td className="px-4 py-3 text-right">
            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarginColorClass(product.margin_rate_percent)}`}>
              {formatPercentage(product.margin_rate_percent)}
            </div>
          </td>

          {/* Prix moyen vente TTC (calculé) */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-700">
              {avgSellPriceTtc > 0 ? formatCurrency(avgSellPriceTtc) : '-'}
            </div>
          </td>

          {/* Jours de stock (calculé) */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-700">
              {stockDays > 0 ? stockDays.toFixed(1) : '-'}
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Prix moyen vente TTC */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-900">
              {formatCurrency(product.avg_sell_price_ttc)}
            </div>
          </td>

          {/* Prix moyen achat HT */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-900">
              {formatCurrency(product.avg_buy_price_ht)}
            </div>
          </td>

          {/* Quantité vendue */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatNumber(product.quantity_sold)}
            </div>
          </td>

          {/* NOUVELLE CELLULE: Évolution */}
          <td className="px-4 py-3 text-right">
            {renderEvolution()}
          </td>

          {/* Marge unitaire HT */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-900">
              {formatCurrency(product.unit_margin_ht)}
            </div>
          </td>

          {/* Taux de marge */}
          <td className="px-4 py-3 text-right">
            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMarginColorClass(product.margin_rate_percent)}`}>
              {formatPercentage(product.margin_rate_percent)}
            </div>
          </td>

          {/* Stock actuel */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-900">
              {formatNumber(product.current_stock)}
            </div>
          </td>

          {/* Rotation stock (calculé) */}
          <td className="px-4 py-3 text-right">
            <div className="text-sm text-gray-700">
              {stockRotationDays > 0 ? stockRotationDays.toFixed(1) : '-'}
            </div>
          </td>
        </>
      )}
    </tr>
  );
};