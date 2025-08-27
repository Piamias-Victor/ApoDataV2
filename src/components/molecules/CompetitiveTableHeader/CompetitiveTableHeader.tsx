// src/components/molecules/CompetitiveTableHeader/CompetitiveTableHeader.tsx
'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { 
  CompetitiveSortConfig, 
  CompetitiveSortableColumn, 
  CompetitiveColumnConfig 
} from '../../organisms/CompetitiveTable/types';

interface CompetitiveTableHeaderProps {
  readonly sortConfig: CompetitiveSortConfig;
  readonly onSort: (column: CompetitiveSortableColumn) => void;
  readonly className?: string;
}

/**
 * Configuration colonnes analyse concurrentielle - VERSION ULTRA-COMPACTE
 */
const getCompetitiveColumnsConfig = (): CompetitiveColumnConfig[] => [
  { key: 'product_name', label: 'Produit', visible: true, sortable: true, format: 'text', align: 'left' },
  { key: 'code_ean', label: 'EAN', visible: true, sortable: true, format: 'text', align: 'left' },
  { key: 'prix_vente_min_global', label: 'Min', visible: true, sortable: true, format: 'currency', align: 'right' },
  { key: 'prix_vente_max_global', label: 'Max', visible: true, sortable: true, format: 'currency', align: 'right' },
  { key: 'prix_vente_moyen_global', label: 'Moy', visible: true, sortable: true, format: 'currency', align: 'right' },
  { key: 'prix_vente_moyen_selection', label: 'PV TTC', visible: true, sortable: true, format: 'currency', align: 'right' },
  { key: 'prix_achat_moyen_ht', label: 'Achat HT', visible: true, sortable: true, format: 'currency', align: 'right' },
  { key: 'taux_marge_moyen_selection', label: 'Marge %', visible: true, sortable: true, format: 'percentage', align: 'right' },
  { key: 'ecart_prix_vs_marche_pct', label: 'Écart %', visible: true, sortable: true, format: 'percentage', align: 'right' },
];

/**
 * CompetitiveTableHeader - En-tête tableau analyse concurrentielle
 * 
 * Features :
 * - 11 colonnes spécifiques analyse concurrentielle
 * - Indicateurs tri (flèches ascendant/descendant)
 * - Style cohérent ProductsTable
 * - Hover states sur colonnes triables
 * - Labels descriptifs métier pharmaceutique
 */
export const CompetitiveTableHeader: React.FC<CompetitiveTableHeaderProps> = ({
  sortConfig,
  onSort,
  className = ''
}) => {
  const columns = getCompetitiveColumnsConfig();

  const getSortIcon = (columnKey: CompetitiveSortableColumn) => {
    if (sortConfig.column !== columnKey) {
      return <div className="w-4 h-4" />; // Placeholder alignement
    }

    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right'): string => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const getHeaderCellClass = (column: CompetitiveColumnConfig): string => {
    const baseClasses = 'px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200';
    const alignClass = getAlignmentClass(column.align);
    const interactiveClass = column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-150' : '';
    
    return `${baseClasses} ${alignClass} ${interactiveClass}`.trim();
  };

  return (
    <thead className={`bg-gray-50 ${className}`}>
      <tr>
        {columns.filter(col => col.visible).map(column => (
          <th
            key={column.key}
            className={getHeaderCellClass(column)}
            onClick={column.sortable ? () => onSort(column.key) : undefined}
            style={{ 
              width: getColumnWidth(column.key),
              maxWidth: getColumnWidth(column.key),
              minWidth: getColumnWidth(column.key)
            }}
          >
            <div className="flex items-center space-x-1">
              <span className="truncate">{column.label}</span>
              {column.sortable && getSortIcon(column.key)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

/**
 * Largeurs fixes en pourcentage pour tableau 700px
 */
function getColumnWidth(columnKey: CompetitiveSortableColumn): string {
  const widthMap: Record<CompetitiveSortableColumn, string> = {
    product_name: '11.5%',   // ~80px
    code_ean: '14.5%',       // ~100px  
    prix_vente_min_global: '10%',      // ~70px
    prix_vente_max_global: '10%',      // ~70px
    prix_vente_moyen_global: '11.5%',  // ~80px
    prix_vente_moyen_selection: '12%', // ~85px
    prix_achat_moyen_ht: '12%',        // ~85px
    taux_marge_moyen_selection: '10.5%', // ~75px
    ecart_prix_vs_marche_pct: '10.5%'   // ~75px
  };
  
  return widthMap[columnKey] || '10%';
}
