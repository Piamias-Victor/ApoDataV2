// src/components/molecules/LaboratoryTable/GenericLaboratoryTableHeader.tsx
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { GenericSortConfig, GenericLaboratorySortableColumn } from '@/types/laboratory';

interface GenericLaboratoryTableHeaderProps {
  readonly sortConfig: GenericSortConfig;
  readonly onSort: (column: GenericLaboratorySortableColumn) => void;
}

export const GenericLaboratoryTableHeader: React.FC<GenericLaboratoryTableHeaderProps> = ({
  sortConfig,
  onSort
}) => {
  const getSortIcon = (column: GenericLaboratorySortableColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const headerClass = "px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors select-none";

  return (
    <thead className="bg-gray-50/80 border-b border-gray-200">
      <tr>
        <th 
          onClick={() => onSort('laboratory_name')}
          className={`${headerClass} text-left`}
        >
          <div className="flex items-center space-x-1">
            <span>Laboratoire</span>
            {getSortIcon('laboratory_name')}
          </div>
        </th>
        
        <th 
          onClick={() => onSort('product_count')}
          className={`${headerClass} text-center`}
        >
          <div className="flex items-center justify-center space-x-1">
            <span>Nb Produits</span>
            {getSortIcon('product_count')}
          </div>
        </th>

        {/* SECTION ACHATS */}
        <th 
          onClick={() => onSort('quantity_bought')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>Volume Achats</span>
            {getSortIcon('quantity_bought')}
          </div>
        </th>

        <th 
          onClick={() => onSort('ca_achats')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>CA Achats</span>
            {getSortIcon('ca_achats')}
          </div>
        </th>

        <th 
          onClick={() => onSort('part_marche_achats_pct')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>PM Achat</span>
            {getSortIcon('part_marche_achats_pct')}
          </div>
        </th>

        {/* MARGE */}
        <th 
          onClick={() => onSort('margin_rate_percent')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>Taux Marge</span>
            {getSortIcon('margin_rate_percent')}
          </div>
        </th>

        {/* SECTION VENTES */}
        <th 
          onClick={() => onSort('quantity_sold')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>Volume Ventes</span>
            {getSortIcon('quantity_sold')}
          </div>
        </th>

        <th 
          onClick={() => onSort('ca_selection')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>CA Ventes</span>
            {getSortIcon('ca_selection')}
          </div>
        </th>

        <th 
          onClick={() => onSort('part_marche_ca_pct')}
          className={`${headerClass} text-right`}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>PM Vente</span>
            {getSortIcon('part_marche_ca_pct')}
          </div>
        </th>
      </tr>
    </thead>
  );
};