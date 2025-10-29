// src/components/molecules/TableRow/TableRow.tsx
'use client';

import React from 'react';
import type { ProductMetrics, ViewMode } from '@/components/organisms/ProductsTable/types';

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
  const rowClass = `${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`;
  const cellClass = 'px-4 py-3 text-sm';
  const numberClass = 'text-right font-medium';

  // Calcul de l'évolution
  const calculateEvolution = (): { value: number | null; display: string; colorClass: string } => {
    if (product.quantity_sold_comparison === null || product.quantity_sold_comparison === 0) {
      return {
        value: null,
        display: 'N/A',
        colorClass: 'text-gray-400'
      };
    }

    const evolution = ((product.quantity_sold - product.quantity_sold_comparison) / product.quantity_sold_comparison) * 100;
    
    let colorClass = 'text-gray-700';
    if (evolution > 0) {
      colorClass = 'text-green-600 font-semibold';
    } else if (evolution < 0) {
      colorClass = 'text-red-600 font-semibold';
    }

    return {
      value: evolution,
      display: `${evolution > 0 ? '+' : ''}${evolution.toFixed(1)}%`,
      colorClass
    };
  };

  const evolution = calculateEvolution();

  const formatNumber = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (viewMode === 'totals') {
    return (
      <tr className={rowClass}>
        <td className={`${cellClass} text-gray-900 font-medium max-w-xs truncate`} title={product.product_name}>
          {product.product_name}
        </td>
        <td className={`${cellClass} text-gray-600 font-mono text-xs`}>
          {product.code_ean}
        </td>
        <td className={`${cellClass} text-gray-700`}>
          {product.bcb_lab || '-'}
        </td>
        <td className={`${cellClass} ${numberClass} text-gray-900`}>
          {formatCurrency(product.ca_ttc)}
        </td>
        <td className={`${cellClass} ${numberClass} text-gray-900`}>
          {formatNumber(product.quantity_sold)}
        </td>
        <td className={`${cellClass} ${numberClass} ${evolution.colorClass}`}>
          {evolution.display}
        </td>
        <td className={`${cellClass} ${numberClass} text-gray-700`}>
          {formatCurrency(product.purchase_amount)}
        </td>
        <td className={`${cellClass} ${numberClass} text-gray-700`}>
          {formatNumber(product.current_stock)}
        </td>
        <td className={`${cellClass} ${numberClass} text-blue-600`}>
          {formatCurrency(product.total_margin_ht)}
        </td>
        <td className={`${cellClass} ${numberClass} text-blue-600`}>
          {formatNumber(product.margin_rate_percent, 1)}%
        </td>
      </tr>
    );
  }

  // Mode Moyennes
  return (
    <tr className={rowClass}>
      <td className={`${cellClass} text-gray-900 font-medium max-w-xs truncate`} title={product.product_name}>
        {product.product_name}
      </td>
      <td className={`${cellClass} text-gray-600 font-mono text-xs`}>
        {product.code_ean}
      </td>
      <td className={`${cellClass} text-gray-700`}>
        {product.bcb_lab || '-'}
      </td>
      <td className={`${cellClass} ${numberClass} text-gray-900`}>
        {formatCurrency(product.avg_sell_price_ttc)}
      </td>
      <td className={`${cellClass} ${numberClass} text-gray-700`}>
        {formatCurrency(product.avg_buy_price_ht)}
      </td>
      <td className={`${cellClass} ${numberClass} text-gray-900`}>
        {formatNumber(product.quantity_sold)}
      </td>
      <td className={`${cellClass} ${numberClass} ${evolution.colorClass}`}>
        {evolution.display}
      </td>
      <td className={`${cellClass} ${numberClass} text-blue-600`}>
        {formatCurrency(product.unit_margin_ht)}
      </td>
      <td className={`${cellClass} ${numberClass} text-blue-600`}>
        {formatNumber(product.margin_rate_percent, 1)}%
      </td>
      <td className={`${cellClass} ${numberClass} text-gray-700`}>
        {formatNumber(product.current_stock)}
      </td>
    </tr>
  );
};