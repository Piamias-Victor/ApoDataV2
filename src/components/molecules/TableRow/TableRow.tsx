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
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(0)}%`;
  };

  const getMarginColorClass = (margin: number): string => {
    if (margin >= 30) return 'text-green-700 bg-green-50';
    if (margin >= 20) return 'text-orange-700 bg-orange-50';
    return 'text-red-700 bg-red-50';
  };

  const stockDays = product.current_stock > 0 && product.quantity_sold > 0
    ? (product.current_stock / product.quantity_sold) * 30
    : 0;

  const stockRotationDays = product.current_stock > 0 && product.quantity_sold > 0
    ? (product.current_stock / product.quantity_sold) * 30
    : 0;

  const renderCaEvolution = () => {
    if (product.ca_ttc_comparison === null || product.ca_ttc_comparison === undefined) {
      return <span className="text-[9px] text-gray-400">N/A</span>;
    }
    
    if (product.ca_ttc_comparison === 0) {
      return <span className="text-[9px] font-semibold text-blue-600">New</span>;
    }
    
    const evolution = ((product.ca_ttc - product.ca_ttc_comparison) / product.ca_ttc_comparison) * 100;
    const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-700';
    
    return (
      <span className={`text-[10px] font-semibold ${colorClass}`}>
        {evolution > 0 ? '+' : ''}{evolution.toFixed(0)}%
      </span>
    );
  };

  const renderQuantityEvolution = () => {
    if (product.quantity_sold_comparison === null || product.quantity_sold_comparison === undefined) {
      return <span className="text-[9px] text-gray-400">N/A</span>;
    }
    
    if (product.quantity_sold_comparison === 0) {
      return <span className="text-[9px] font-semibold text-blue-600">New</span>;
    }
    
    const evolution = ((product.quantity_sold - product.quantity_sold_comparison) / product.quantity_sold_comparison) * 100;
    const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-700';
    
    return (
      <span className={`text-[10px] font-semibold ${colorClass}`}>
        {evolution > 0 ? '+' : ''}{evolution.toFixed(0)}%
      </span>
    );
  };

  return (
    <tr className={`${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
      {/* Code EAN */}
      <td className="px-1.5 py-1.5">
        <div className="text-[9px] text-gray-600 font-mono">
          {product.code_ean}
        </div>
      </td>

      {/* Produit */}
      <td className="px-1.5 py-1.5">
        <div className="text-[10px] font-medium text-gray-900 max-w-[200px] truncate" title={product.product_name}>
          {product.product_name}
        </div>
      </td>

      {/* Laboratoire */}
      <td className="px-1.5 py-1.5">
        <div className="text-[10px] text-gray-700 max-w-[100px] truncate" title={product.bcb_lab || '-'}>
          {product.bcb_lab || '-'}
        </div>
      </td>

      {viewMode === 'totals' ? (
        <>
          {/* CA TTC */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] font-medium text-gray-900">
              {formatCurrency(product.ca_ttc)}
            </div>
          </td>

          {/* Évolution CA */}
          <td className="px-1.5 py-1.5 text-right">
            {renderCaEvolution()}
          </td>

          {/* Quantité vendue */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] font-medium text-gray-900">
              {formatNumber(product.quantity_sold)}
            </div>
          </td>

          {/* Évolution Qté */}
          <td className="px-1.5 py-1.5 text-right">
            {renderQuantityEvolution()}
          </td>

          {/* Quantité achetée */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {formatNumber(product.quantity_bought)}
            </div>
          </td>

          {/* Montant achat */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {formatCurrency(product.purchase_amount)}
            </div>
          </td>

          {/* Stock actuel */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {formatNumber(product.current_stock)}
            </div>
          </td>

          {/* Marge totale HT */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] font-medium text-gray-900">
              {formatCurrency(product.total_margin_ht)}
            </div>
          </td>

          {/* Taux de marge */}
          <td className="px-1.5 py-1.5 text-center">
            <div className={`inline-flex px-1 py-0.5 text-[9px] font-semibold rounded ${getMarginColorClass(product.margin_rate_percent)}`}>
              {formatPercentage(product.margin_rate_percent)}
            </div>
          </td>

          {/* Jours de stock */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-700">
              {stockDays > 0 ? stockDays.toFixed(0) : '-'}
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Prix moyen vente TTC */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {product.avg_sell_price_ttc.toFixed(2)}
            </div>
          </td>

          {/* Prix moyen achat HT */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {product.avg_buy_price_ht.toFixed(2)}
            </div>
          </td>

          {/* Quantité vendue */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] font-medium text-gray-900">
              {formatNumber(product.quantity_sold)}
            </div>
          </td>

          {/* Évolution */}
          <td className="px-1.5 py-1.5 text-right">
            {renderQuantityEvolution()}
          </td>

          {/* Marge unitaire HT */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {product.unit_margin_ht.toFixed(2)}
            </div>
          </td>

          {/* Taux de marge */}
          <td className="px-1.5 py-1.5 text-center">
            <div className={`inline-flex px-1 py-0.5 text-[9px] font-semibold rounded ${getMarginColorClass(product.margin_rate_percent)}`}>
              {formatPercentage(product.margin_rate_percent)}
            </div>
          </td>

          {/* Stock actuel */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-900">
              {formatNumber(product.current_stock)}
            </div>
          </td>

          {/* Rotation stock */}
          <td className="px-1.5 py-1.5 text-right">
            <div className="text-[10px] text-gray-700">
              {stockRotationDays > 0 ? stockRotationDays.toFixed(0) : '-'}
            </div>
          </td>
        </>
      )}
    </tr>
  );
};