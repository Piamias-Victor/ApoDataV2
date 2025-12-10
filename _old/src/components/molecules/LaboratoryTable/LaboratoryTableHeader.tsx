// src/components/molecules/LaboratoryTable/LaboratoryTableHeader.tsx
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortConfig, LaboratorySortableColumn } from '@/types/laboratory';

interface LaboratoryTableHeaderProps {
  sortConfig: SortConfig;
  onSort: (column: LaboratorySortableColumn) => void;
}

export const LaboratoryTableHeader: React.FC<LaboratoryTableHeaderProps> = ({
  sortConfig,
  onSort
}) => {
  const getSortIcon = (column: LaboratorySortableColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  const headerClass = "px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors";
  
  return (
    <thead className="bg-gray-50">
      <tr>
        <th 
          onClick={() => onSort('laboratory_name')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Laboratoire</span>
            {getSortIcon('laboratory_name')}
          </div>
        </th>
        
        <th 
          onClick={() => onSort('product_count')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Nb produits</span>
            {getSortIcon('product_count')}
          </div>
        </th>

        <th 
          onClick={() => onSort('quantity_sold')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Qté vendues</span>
            {getSortIcon('quantity_sold')}
          </div>
        </th>

        <th 
          onClick={() => onSort('margin_rate_percent')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Taux marge</span>
            {getSortIcon('margin_rate_percent')}
          </div>
        </th>
        
        <th 
          onClick={() => onSort('ca_selection')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>CA Réalisé</span>
            {getSortIcon('ca_selection')}
          </div>
        </th>
        
        <th 
          onClick={() => onSort('marge_selection')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Marge Réalisée</span>
            {getSortIcon('marge_selection')}
          </div>
        </th>
        
        <th 
          onClick={() => onSort('part_marche_ca_pct')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Part Marché CA</span>
            {getSortIcon('part_marche_ca_pct')}
          </div>
        </th>
        
        <th 
          onClick={() => onSort('part_marche_marge_pct')}
          className={headerClass}
        >
          <div className="flex items-center space-x-1">
            <span>Part Marché Marge</span>
            {getSortIcon('part_marche_marge_pct')}
          </div>
        </th>
      </tr>
    </thead>
  );
};