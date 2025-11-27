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
  const getSortIcon = (column: SortableColumn) => {
    if (sortConfig.column !== column) return null;

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-2.5 h-2.5" />
    ) : (
      <ChevronDown className="w-2.5 h-2.5" />
    );
  };

  const handleSort = (column: SortableColumn) => {
    onSort(column);
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {/* Code EAN */}
        <th
          className="px-1.5 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleSort('code_ean')}
        >
          <div className="flex items-center space-x-0.5">
            <span>Code EAN</span>
            {getSortIcon('code_ean')}
          </div>
        </th>

        {/* Nom produit */}
        <th
          className="px-1.5 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleSort('product_name')}
        >
          <div className="flex items-center space-x-0.5">
            <span>Produit</span>
            {getSortIcon('product_name')}
          </div>
        </th>

        {/* Laboratoire */}
        <th
          className="px-1.5 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleSort('bcb_lab')}
        >
          <div className="flex items-center space-x-0.5">
            <span>Lab</span>
            {getSortIcon('bcb_lab')}
          </div>
        </th>

        {viewMode === 'totals' ? (
          <>
            {/* CA TTC */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('ca_ttc')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>CA TTC</span>
                {getSortIcon('ca_ttc')}
              </div>
            </th>

            {/* Évolution CA */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('ca_ttc_evolution')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Evol CA</span>
                {getSortIcon('ca_ttc_evolution')}
              </div>
            </th>

            {/* Quantité vendue */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('quantity_sold')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Qté V.</span>
                {getSortIcon('quantity_sold')}
              </div>
            </th>

            {/* Évolution Qté */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('quantity_sold_evolution')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Evol Qté</span>
                {getSortIcon('quantity_sold_evolution')}
              </div>
            </th>

            {/* Quantité achetée */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('quantity_bought')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Qté A.</span>
                {getSortIcon('quantity_bought')}
              </div>
            </th>

            {/* Évolution Qté Achetée */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('quantity_bought_evolution')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Evol Qté A.</span>
                {getSortIcon('quantity_bought_evolution')}
              </div>
            </th>

            {/* Montant achat */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('purchase_amount')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Mt.Ach</span>
                {getSortIcon('purchase_amount')}
              </div>
            </th>

            {/* Évolution Montant Achat */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('purchase_amount_evolution')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Evol Mt.Ach</span>
                {getSortIcon('purchase_amount_evolution')}
              </div>
            </th>

            {/* Stock actuel */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('current_stock')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Stock</span>
                {getSortIcon('current_stock')}
              </div>
            </th>

            {/* Marge totale HT */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('total_margin_ht')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Mg.Tot</span>
                {getSortIcon('total_margin_ht')}
              </div>
            </th>

            {/* Taux marge */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('margin_rate_percent')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Tx.Mg</span>
                {getSortIcon('margin_rate_percent')}
              </div>
            </th>

            {/* Jours stock */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('days_stock')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>J.Stk</span>
                {getSortIcon('days_stock')}
              </div>
            </th>
          </>
        ) : (
          <>
            {/* Prix moyen vente TTC */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('avg_sell_price_ttc')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>P.Vte</span>
                {getSortIcon('avg_sell_price_ttc')}
              </div>
            </th>

            {/* Prix moyen achat HT */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('avg_buy_price_ht')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>P.Ach</span>
                {getSortIcon('avg_buy_price_ht')}
              </div>
            </th>

            {/* Quantité vendue */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('quantity_sold')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Qté</span>
                {getSortIcon('quantity_sold')}
              </div>
            </th>

            {/* Évolution */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('quantity_sold_evolution')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Evol</span>
                {getSortIcon('quantity_sold_evolution')}
              </div>
            </th>

            {/* Marge unitaire HT */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('unit_margin_ht')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Mg.Unit</span>
                {getSortIcon('unit_margin_ht')}
              </div>
            </th>

            {/* Taux marge */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('margin_rate_percent')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Tx.Mg</span>
                {getSortIcon('margin_rate_percent')}
              </div>
            </th>

            {/* Stock actuel */}
            <th
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('current_stock')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Stock</span>
                {getSortIcon('current_stock')}
              </div>
            </th>

            {/* Rotation */}
            <th className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span>Rot.J</span>
            </th>
          </>
        )}
      </tr>
    </thead>
  );
};