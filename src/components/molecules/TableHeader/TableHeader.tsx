// src/components/molecules/TableHeader/TableHeader.tsx
'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortConfig, SortableColumn, ViewMode, ColumnConfig } from '../../organisms/ProductsTable/types';

interface TableHeaderProps {
  readonly viewMode: ViewMode;
  readonly sortConfig: SortConfig;
  readonly onSort: (column: SortableColumn) => void;
  readonly className?: string;
}

/**
 * Configuration colonnes selon vue active
 */
const getColumnsConfig = (viewMode: ViewMode): ColumnConfig[] => {
  const baseColumns: ColumnConfig[] = [
    { key: 'product_name', label: 'Produit', visible: true, sortable: true, format: 'text', align: 'left' },
    { key: 'code_ean', label: 'Code EAN', visible: true, sortable: true, format: 'text', align: 'left' },
    { key: 'current_stock', label: 'Stock', visible: true, sortable: true, format: 'number', align: 'right' },
    { key: 'quantity_sold', label: 'Qté vendue', visible: true, sortable: true, format: 'number', align: 'right' },
  ];

  if (viewMode === 'totals') {
    return [
      ...baseColumns,
      { key: 'ca_ttc', label: 'CA TTC', visible: true, sortable: true, format: 'currency', align: 'right' },
      { key: 'purchase_amount', label: 'Achat total', visible: true, sortable: true, format: 'currency', align: 'right' },
      { key: 'total_margin_ht', label: 'Total Marge', visible: true, sortable: true, format: 'currency', align: 'right' },
      { key: 'margin_rate_percent', label: '% marge', visible: true, sortable: true, format: 'percentage', align: 'right' },
    ];
  }

  // Vue moyennes
  return [
    ...baseColumns,
    { key: 'avg_sell_price_ttc', label: 'Prix vente moy.', visible: true, sortable: true, format: 'currency', align: 'right' },
    { key: 'avg_buy_price_ht', label: 'Prix achat moy.', visible: true, sortable: true, format: 'currency', align: 'right' },
    { key: 'unit_margin_ht', label: 'Marge moyenne', visible: true, sortable: true, format: 'currency', align: 'right' },
    { key: 'margin_rate_percent', label: '% marge', visible: true, sortable: true, format: 'percentage', align: 'right' },
  ];
};

/**
 * TableHeader - En-tête tableau avec tri par colonne
 * 
 * Features :
 * - Colonnes adaptées selon vue (totaux/moyennes)
 * - Indicateurs tri (flèches ascendant/descendant)
 * - Style cohérent fond gris clair
 * - Hover states sur colonnes triables
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  viewMode,
  sortConfig,
  onSort,
  className = ''
}) => {
  const columns = getColumnsConfig(viewMode);

  const getSortIcon = (columnKey: SortableColumn) => {
    if (sortConfig.column !== columnKey) {
      return <div className="w-4 h-4" />; // Placeholder pour alignement
    }

    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <thead className={className}>
      <tr className="bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <th
            key={column.key}
            className={`
              px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider
              ${getAlignmentClass(column.align)}
              ${column.sortable 
                ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-150 select-none' 
                : ''
              }
            `}
            onClick={column.sortable ? () => onSort(column.key) : undefined}
            role={column.sortable ? 'button' : undefined}
            tabIndex={column.sortable ? 0 : undefined}
            aria-sort={
              sortConfig.column === column.key
                ? sortConfig.direction === 'asc' 
                  ? 'ascending' 
                  : 'descending'
                : undefined
            }
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && (
                <div className="flex-shrink-0 text-gray-400">
                  {getSortIcon(column.key)}
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};