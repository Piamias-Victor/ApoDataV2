// src/components/molecules/LaboratoryTable/LaboratoryTableRowWithRanking.tsx
import { formatBigNumber, formatEvolutionPercentage, formatPDM, formatRankGain, getEvolutionColorClass, getRankGainColorClass } from '@/hooks/utils/formatters/ranking';
import { LaboratoryMarketShare } from '@/types/laboratory';

interface LaboratoryTableRowWithRankingProps {
  readonly laboratory: LaboratoryMarketShare;
  readonly isEven: boolean;
  readonly hasComparison: boolean;
}

export const LaboratoryTableRowWithRanking: React.FC<LaboratoryTableRowWithRankingProps> = ({
  laboratory,
  isEven,
  hasComparison
}) => {
  return (
    <tr className={`${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {laboratory.laboratory_name}
      </td>
      
      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
        {laboratory.rang_actuel}
      </td>
      
      {hasComparison && (
        <td className={`px-4 py-3 text-sm text-right font-medium ${getRankGainColorClass(laboratory.gain_rang)}`}>
          {formatRankGain(laboratory.gain_rang)}
        </td>
      )}
      
      <td className="px-4 py-3 text-sm text-right text-gray-600">
        {formatBigNumber(laboratory.product_count)}
      </td>
      
      <td className="px-4 py-3 text-sm text-right text-gray-700">
        {formatBigNumber(laboratory.quantity_bought)}
      </td>
      
      <td className="px-4 py-3 text-sm text-right text-gray-700">
        {formatBigNumber(laboratory.ca_achats)}€
      </td>
      
      <td className="px-4 py-3 text-sm text-right text-gray-700">
        {formatBigNumber(laboratory.quantity_sold)}
      </td>
      
      <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
        {formatBigNumber(laboratory.ca_selection)}€
      </td>
      
      {hasComparison && (
        <>
          <td className={`px-4 py-3 text-sm text-right font-medium ${getEvolutionColorClass(laboratory.evol_achats_pct)}`}>
            {formatEvolutionPercentage(laboratory.evol_achats_pct)}
          </td>
          
          <td className={`px-4 py-3 text-sm text-right font-medium ${getEvolutionColorClass(laboratory.evol_ventes_pct)}`}>
            {formatEvolutionPercentage(laboratory.evol_ventes_pct)}
          </td>
        </>
      )}
      
      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
        {formatPDM(laboratory.margin_rate_percent)}
      </td>
      
      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
        {formatPDM(laboratory.part_marche_ca_pct)}
      </td>
      
      {hasComparison && (
        <td className={`px-4 py-3 text-sm text-right font-medium ${getEvolutionColorClass(laboratory.evol_pdm_pct)}`}>
          {formatEvolutionPercentage(laboratory.evol_pdm_pct)}
        </td>
      )}
    </tr>
  );
};