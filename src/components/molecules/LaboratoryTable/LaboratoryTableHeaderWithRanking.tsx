// src/components/molecules/LaboratoryTable/LaboratoryTableHeaderWithRanking.tsx
import { ArrowUp, ArrowDown } from 'lucide-react';
import { LaboratorySortableColumn, SortConfig } from '@/types/laboratory';

interface LaboratoryTableHeaderWithRankingProps {
  readonly sortConfig: SortConfig;
  readonly onSort: (column: LaboratorySortableColumn) => void;
  readonly hasComparison: boolean;
}

export const LaboratoryTableHeaderWithRanking: React.FC<LaboratoryTableHeaderWithRankingProps> = ({
  sortConfig,
  onSort,
  hasComparison
}) => {
  const renderSortIcon = (column: LaboratorySortableColumn) => {
    if (sortConfig.column !== column) {
      return <div className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const SortButton: React.FC<{
    column: LaboratorySortableColumn;
    children: React.ReactNode;
    align?: 'left' | 'right';
  }> = ({ column, children, align = 'left' }) => (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 hover:text-gray-900 transition-colors ${
        align === 'right' ? 'justify-end w-full' : ''
      }`}
    >
      {children}
      {renderSortIcon(column)}
    </button>
  );

  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <SortButton column="laboratory_name">Marque</SortButton>
        </th>
        
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
          <SortButton column="rang_actuel" align="right">Rang</SortButton>
        </th>
        
        {hasComparison && (
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
            <SortButton column="gain_rang" align="right">Gain Rang</SortButton>
          </th>
        )}
        
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
          <SortButton column="ca_achats" align="right">Montant achat</SortButton>
        </th>
        
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
          <SortButton column="ca_selection" align="right">Montant ventes</SortButton>
        </th>
        
        {hasComparison && (
          <>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
              <SortButton column="evol_achats_pct" align="right">Evol % achat</SortButton>
            </th>
            
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
              <SortButton column="evol_ventes_pct" align="right">Evol % ventes</SortButton>
            </th>
          </>
        )}
        
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
          <SortButton column="part_marche_ca_pct" align="right">PDM</SortButton>
        </th>
        
        {hasComparison && (
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
            <SortButton column="evol_pdm_pct" align="right">Evol PDM %</SortButton>
          </th>
        )}
      </tr>
    </thead>
  );
};