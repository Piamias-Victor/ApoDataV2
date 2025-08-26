// src/components/molecules/TableRow/TableRow.tsx
'use client';

import React from 'react';
import type { ProductMetrics, ViewMode } from '../../organisms/ProductsTable/types';
import { formatCurrency, formatNumber, formatPercentage, getMarginColorClass } from '../../organisms/ProductsTable/utils';

interface TableRowProps {
  readonly product: ProductMetrics;
  readonly viewMode: ViewMode;
  readonly isEven: boolean;
  readonly className?: string;
}

/**
 * TableRow - Ligne de données produit avec formatage métier
 * 
 * Features :
 * - Formatage intelligent : 12K, 1.2M pour grands nombres
 * - Couleurs conditionnelles marges (vert >30%, orange 20-30%, rouge <20%)
 * - Alternance couleurs lignes (gris léger une ligne sur deux)
 * - Hover states pour UX
 * - Colonnes adaptées selon vue (totaux/moyennes)
 */
export const TableRow: React.FC<TableRowProps> = ({
  product,
  viewMode,
  isEven,
  className = ''
}) => {
  const marginColorClass = getMarginColorClass(product.margin_rate_percent);

  const rowBgClass = isEven 
    ? 'bg-white hover:bg-gray-50' 
    : 'bg-gray-25 hover:bg-gray-50';

  return (
    <tr className={`
      border-b border-gray-100 transition-colors duration-150
      ${rowBgClass}
      ${className}
    `}>
      
      {/* Colonnes communes */}
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
        <div className="max-w-xs truncate" title={product.product_name}>
          {product.product_name}
        </div>
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
        {product.code_ean}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
        {formatNumber(product.current_stock)}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
        {formatNumber(product.quantity_sold)}
      </td>

      {/* Colonnes selon vue */}
      {viewMode === 'totals' ? (
        <>
          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
            {formatCurrency(product.ca_ttc)}
          </td>
          
          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
            {formatCurrency(product.purchase_amount)}
          </td>
          
          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
            {formatCurrency(product.total_margin_ht)}
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
            {formatCurrency(product.avg_sell_price_ttc)}
          </td>
          
          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
            {formatCurrency(product.avg_buy_price_ht)}
          </td>
          
          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
            {formatCurrency(product.unit_margin_ht)}
          </td>
        </>
      )}

      {/* Colonne % marge avec couleur conditionnelle */}
      <td className="px-4 py-3 text-right">
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${marginColorClass}
        `}>
          {formatPercentage(product.margin_rate_percent)}
        </span>
      </td>
      
    </tr>
  );
};