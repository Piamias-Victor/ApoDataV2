// src/components/molecules/TableHeader/TableHeader.tsx
'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ViewMode, SortConfig, SortableColumn } from '@/components/organisms/ProductsTable/types';

interface TableHeaderProps {
  readonly viewMode: ViewMode;
  readonly sortConfig: SortConfig;
  readonly onSort: (column: SortableColumn) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  viewMode,
  sortConfig,
  onSort
}) => {
  const getSortIcon = (column: SortableColumn): React.ReactNode => {
    if (sortConfig.column !== column) return null;
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handleHeaderClick = (column: SortableColumn) => {
    onSort(column);
  };

  const headerClass = "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none";
  const sortableClass = "flex items-center space-x-1";

  if (viewMode === 'totals') {
    return (
      <thead className="bg-gray-50 border-b-2 border-gray-200">
        <tr>
          <th className={headerClass} onClick={() => handleHeaderClick('product_name')}>
            <div className={sortableClass}>
              <span>Produit</span>
              {getSortIcon('product_name')}
            </div>
          </th>
          <th className={headerClass} onClick={() => handleHeaderClick('code_ean')}>
            <div className={sortableClass}>
              <span>Code EAN</span>
              {getSortIcon('code_ean')}
            </div>
          </th>
          <th className={headerClass} onClick={() => handleHeaderClick('bcb_lab')}>
            <div className={sortableClass}>
              <span>Laboratoire</span>
              {getSortIcon('bcb_lab')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('ca_ttc')}>
            <div className={`${sortableClass} justify-end`}>
              <span>CA TTC (€)</span>
              {getSortIcon('ca_ttc')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('quantity_sold')}>
            <div className={`${sortableClass} justify-end`}>
              <span>Qté vendue</span>
              {getSortIcon('quantity_sold')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('quantity_sold_evolution')}>
            <div className={`${sortableClass} justify-end`}>
              <span>Évolution Qté (%)</span>
              {getSortIcon('quantity_sold_evolution')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('purchase_amount')}>
            <div className={`${sortableClass} justify-end`}>
              <span>Achat (€)</span>
              {getSortIcon('purchase_amount')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('current_stock')}>
            <div className={`${sortableClass} justify-end`}>
              <span>Stock</span>
              {getSortIcon('current_stock')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('total_margin_ht')}>
            <div className={`${sortableClass} justify-end`}>
              <span>Marge HT (€)</span>
              {getSortIcon('total_margin_ht')}
            </div>
          </th>
          <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('margin_rate_percent')}>
            <div className={`${sortableClass} justify-end`}>
              <span>Taux marge (%)</span>
              {getSortIcon('margin_rate_percent')}
            </div>
          </th>
        </tr>
      </thead>
    );
  }

  // Mode Moyennes
  return (
    <thead className="bg-gray-50 border-b-2 border-gray-200">
      <tr>
        <th className={headerClass} onClick={() => handleHeaderClick('product_name')}>
          <div className={sortableClass}>
            <span>Produit</span>
            {getSortIcon('product_name')}
          </div>
        </th>
        <th className={headerClass} onClick={() => handleHeaderClick('code_ean')}>
          <div className={sortableClass}>
            <span>Code EAN</span>
            {getSortIcon('code_ean')}
          </div>
        </th>
        <th className={headerClass} onClick={() => handleHeaderClick('bcb_lab')}>
          <div className={sortableClass}>
            <span>Laboratoire</span>
            {getSortIcon('bcb_lab')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('avg_sell_price_ttc')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Prix vente TTC (€)</span>
            {getSortIcon('avg_sell_price_ttc')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('avg_buy_price_ht')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Prix achat HT (€)</span>
            {getSortIcon('avg_buy_price_ht')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('quantity_sold')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Qté vendue</span>
            {getSortIcon('quantity_sold')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('quantity_sold_evolution')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Évolution Qté (%)</span>
            {getSortIcon('quantity_sold_evolution')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('unit_margin_ht')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Marge unit. HT (€)</span>
            {getSortIcon('unit_margin_ht')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('margin_rate_percent')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Taux marge (%)</span>
            {getSortIcon('margin_rate_percent')}
          </div>
        </th>
        <th className={`${headerClass} text-right`} onClick={() => handleHeaderClick('current_stock')}>
          <div className={`${sortableClass} justify-end`}>
            <span>Stock</span>
            {getSortIcon('current_stock')}
          </div>
        </th>
      </tr>
    </thead>
  );
};