// src/components/molecules/TableHeader/TableHeader.tsx
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ViewMode, SortConfig, SortableColumn } from '../../organisms/ProductsTable/types';

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
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  const handleSort = (column: SortableColumn) => {
    onSort(column);
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {/* Produit */}
        <th 
          className="px-1.5 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleSort('product_name')}
        >
          <div className="flex items-center space-x-0.5">
            <span>Produit</span>
            {getSortIcon('product_name')}
          </div>
        </th>

        {/* Code EAN */}
        <th 
          className="px-1.5 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-24"
          onClick={() => handleSort('code_ean')}
        >
          <div className="flex items-center space-x-0.5">
            <span>EAN</span>
            {getSortIcon('code_ean')}
          </div>
        </th>

        {/* Laboratoire */}
        <th 
          className="px-1.5 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleSort('bcb_lab')}
        >
          <div className="flex items-center space-x-0.5">
            <span>Labo</span>
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
            <th className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span>Evol</span>
            </th>

            {/* Montant achat */}
            <th 
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('purchase_amount')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>Achat</span>
                {getSortIcon('purchase_amount')}
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
                <span>Marge</span>
                {getSortIcon('total_margin_ht')}
              </div>
            </th>

            {/* Taux de marge */}
            <th 
              className="px-1.5 py-1.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-12"
              onClick={() => handleSort('margin_rate_percent')}
            >
              <div className="flex items-center justify-center space-x-0.5">
                <span>%M</span>
                {getSortIcon('margin_rate_percent')}
              </div>
            </th>

            {/* Prix moyen vente TTC */}
            <th className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span>P.Moy</span>
            </th>

            {/* Jours de stock */}
            <th className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span>J.Stk</span>
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
            <th className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span>Evol</span>
            </th>

            {/* Marge unitaire HT */}
            <th 
              className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('unit_margin_ht')}
            >
              <div className="flex items-center justify-end space-x-0.5">
                <span>M.Unit</span>
                {getSortIcon('unit_margin_ht')}
              </div>
            </th>

            {/* Taux de marge */}
            <th 
              className="px-1.5 py-1.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-12"
              onClick={() => handleSort('margin_rate_percent')}
            >
              <div className="flex items-center justify-center space-x-0.5">
                <span>%M</span>
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

            {/* Rotation stock */}
            <th className="px-1.5 py-1.5 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span>Rot</span>
            </th>
          </>
        )}
      </tr>
    </thead>
  );
};