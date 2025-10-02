// src/components/molecules/LaboratoryTable/LaboratoryTableHeader.tsx
'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortConfig, LaboratorySortableColumn } from '@/components/organisms/LaboratoryMarketShareSection/types';

interface LaboratoryTableHeaderProps {
  readonly sortConfig: SortConfig;
  readonly onSort: (column: LaboratorySortableColumn) => void;
}

export const LaboratoryTableHeader: React.FC<LaboratoryTableHeaderProps> = ({
  sortConfig,
  onSort
}) => {
  const renderSortIcon = (column: LaboratorySortableColumn) => {
    if (sortConfig.column !== column) {
      return <div className="w-4 h-4" />;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const headerClass = "px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none";
  const sortableClass = "flex items-center space-x-1";

  return (
    <thead className="bg-gray-50">
      <tr>
        <th className={headerClass} onClick={() => onSort('laboratory_name')}>
          <div className={sortableClass}>
            <span>Laboratoire</span>
            {renderSortIcon('laboratory_name')}
          </div>
        </th>
        
        <th className={headerClass} onClick={() => onSort('product_count')}>
          <div className={sortableClass}>
            <span>Produits</span>
            {renderSortIcon('product_count')}
          </div>
        </th>
        
        <th className={headerClass} onClick={() => onSort('ca_selection')}>
          <div className={sortableClass}>
            <span>CA Réalisé</span>
            {renderSortIcon('ca_selection')}
          </div>
        </th>
        
        <th className={headerClass} onClick={() => onSort('marge_selection')}>
          <div className={sortableClass}>
            <span>Marge Réalisée</span>
            {renderSortIcon('marge_selection')}
          </div>
        </th>
        
        <th className={headerClass} onClick={() => onSort('part_marche_ca_pct')}>
          <div className={sortableClass}>
            <span>Part Marché CA</span>
            {renderSortIcon('part_marche_ca_pct')}
          </div>
        </th>
        
        <th className={headerClass} onClick={() => onSort('part_marche_marge_pct')}>
          <div className={sortableClass}>
            <span>Part Marché Marge</span>
            {renderSortIcon('part_marche_marge_pct')}
          </div>
        </th>
      </tr>
    </thead>
  );
};