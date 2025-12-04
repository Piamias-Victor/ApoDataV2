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

  const renderEvolution = (current: number, comparison: number | null | undefined, formatFn: (v: number) => string) => {
    if (comparison === null || comparison === undefined) {
      return <span className="text-[9px] text-gray-400">N-1: -</span>;
    }

    if (comparison === 0) {
      return <span className="text-[9px] font-semibold text-blue-600">New</span>;
    }

    const evolution = ((current - comparison) / comparison) * 100;
    const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-500';
    const arrow = evolution > 0 ? '↑' : evolution < 0 ? '↓' : '';

    return (
      <div className="flex items-center justify-end space-x-1">
        <span className="text-[9px] text-gray-400">{formatFn(comparison)}</span>
        <span className={`text-[9px] font-semibold ${colorClass}`}>
          {arrow} {Math.abs(evolution).toFixed(0)}%
        </span>
      </div>
    );
  };

  return (
    <tr className={`${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
      {/* Code EAN */}
      <td className="px-1.5 py-1.5 align-top">
        <div className="text-[9px] text-gray-600 font-mono">
          {product.code_ean}
        </div>
      </td>

      {/* Produit */}
      <td className="px-1.5 py-1.5 align-top">
        <div className="text-[10px] font-medium text-gray-900 max-w-[200px] truncate" title={product.product_name}>
          {product.product_name}
        </div>
      </td>

      {/* Laboratoire */}
      <td className="px-1.5 py-1.5 align-top">
        <div className="text-[10px] text-gray-700 max-w-[100px] truncate" title={product.bcb_lab || '-'}>
          {product.bcb_lab || '-'}
        </div>
      </td>

      {viewMode === 'totals' ? (
        <>
          {/* CA TTC */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-gray-900">{formatCurrency(product.ca_ttc)}</span>
              {renderEvolution(product.ca_ttc, product.ca_ttc_comparison, formatCurrency)}
            </div>
          </td>

          {/* Quantité vendue */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-gray-900">{formatNumber(product.quantity_sold)}</span>
              {renderEvolution(product.quantity_sold, product.quantity_sold_comparison, formatNumber)}
            </div>
          </td>

          {/* Quantité achetée */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-900">{formatNumber(product.quantity_bought)}</span>
              {renderEvolution(product.quantity_bought, product.quantity_bought_comparison, formatNumber)}
            </div>
          </td>

          {/* Montant achat */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-900">{formatCurrency(product.purchase_amount)}</span>
              {renderEvolution(product.purchase_amount, product.purchase_amount_comparison, formatCurrency)}
            </div>
          </td>

          {/* Stock actuel */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-900">
              {formatNumber(product.current_stock)}
            </div>
          </td>

          {/* Marge totale HT */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] font-medium text-gray-900">
              {formatCurrency(product.total_margin_ht)}
            </div>
          </td>

          {/* Taux de marge */}
          <td className="px-1.5 py-1.5 text-center align-top">
            <div className={`inline-flex px-1 py-0.5 text-[9px] font-semibold rounded ${getMarginColorClass(product.margin_rate_percent)}`}>
              {formatPercentage(product.margin_rate_percent)}
            </div>
          </td>

          {/* Jours de stock */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-700">
              {stockDays > 0 ? stockDays.toFixed(0) : '-'}
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Prix moyen vente TTC */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-900">
              {product.avg_sell_price_ttc.toFixed(2)}
            </div>
          </td>

          {/* Prix moyen achat HT */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-900">
              {product.avg_buy_price_ht.toFixed(2)}
            </div>
          </td>

          {/* Quantité vendue */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-gray-900">{formatNumber(product.quantity_sold)}</span>
              {renderEvolution(product.quantity_sold, product.quantity_sold_comparison, formatNumber)}
            </div>
          </td>

          {/* Marge unitaire HT */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-900">
              {product.unit_margin_ht.toFixed(2)}
            </div>
          </td>

          {/* Taux de marge */}
          <td className="px-1.5 py-1.5 text-center align-top">
            <div className={`inline-flex px-1 py-0.5 text-[9px] font-semibold rounded ${getMarginColorClass(product.margin_rate_percent)}`}>
              {formatPercentage(product.margin_rate_percent)}
            </div>
          </td>

          {/* Stock actuel */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-900">
              {formatNumber(product.current_stock)}
            </div>
          </td>

          {/* Rotation stock */}
          <td className="px-1.5 py-1.5 text-right align-top">
            <div className="text-[10px] text-gray-700">
              {stockRotationDays > 0 ? stockRotationDays.toFixed(0) : '-'}
            </div>
          </td>
        </>
      )}
    </tr>
  );
};