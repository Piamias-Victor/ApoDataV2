// src/components/molecules/LaboratoryTable/LaboratoryTableRowWithRanking.tsx
import { formatBigNumber, formatPDM, formatRankGain, getRankGainColorClass } from '@/hooks/utils/formatters/ranking';
import { LaboratoryMarketShare } from '@/types/laboratory';

interface LaboratoryTableRowWithRankingProps {
  readonly laboratory: LaboratoryMarketShare;
  readonly isEven: boolean;
  readonly hasComparison: boolean;
  readonly isSelected?: boolean;
  readonly onClick?: (laboratory: LaboratoryMarketShare) => void;
}

export const LaboratoryTableRowWithRanking: React.FC<LaboratoryTableRowWithRankingProps> = ({
  laboratory,
  isEven,
  hasComparison,
  isSelected = false,
  onClick
}) => {


  const renderEvolution = (current: number, comparison: number | null | undefined, formatFn: (v: number) => string, isPoints: boolean = false) => {
    if (comparison === null || comparison === undefined) {
      return <span className="text-[9px] text-gray-400">N-1: -</span>;
    }

    if (current === 0 && comparison === 0) {
      return <span className="text-[9px] text-gray-400">-</span>;
    }

    if (comparison === 0) {
      return <span className="text-[9px] font-semibold text-blue-600">New</span>;
    }

    let evolution: number;
    let evolutionText: string;

    if (isPoints) {
      evolution = current - comparison;
      evolutionText = `${Math.abs(evolution).toFixed(1)} pts`;
    } else {
      evolution = ((current - comparison) / comparison) * 100;
      evolutionText = `${Math.abs(evolution).toFixed(1)}%`;
    }

    const colorClass = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-500';
    const arrow = evolution > 0 ? '↑' : evolution < 0 ? '↓' : '';

    return (
      <div className="flex items-center justify-end space-x-1">
        <span className="text-[9px] text-gray-400">{formatFn(comparison)}</span>
        <span className={`text-[9px] font-semibold ${colorClass}`}>
          {arrow} {evolutionText}
        </span>
      </div>
    );
  };

  const handleClick = () => {
    if (onClick) {
      onClick(laboratory);
    }
  };

  return (
    <tr
      className={`${isEven ? 'bg-white' : 'bg-gray-50'} ${isSelected ? 'bg-blue-50 ring-2 ring-blue-400' : 'hover:bg-blue-50'} transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
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

      <td className="px-4 py-3 text-right align-top">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-700">
            {formatBigNumber(laboratory.ca_achats)}€
          </span>
          {hasComparison && renderEvolution(laboratory.ca_achats, laboratory.ca_achats_comparison, (v) => `${formatBigNumber(v)}€`)}
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-right text-gray-700">
        {formatBigNumber(laboratory.quantity_sold)}
      </td>

      <td className="px-4 py-3 text-right align-top">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-900 font-semibold">
            {formatBigNumber(laboratory.ca_selection)}€
          </span>
          {hasComparison && renderEvolution(laboratory.ca_selection, laboratory.ca_selection_comparison, (v) => `${formatBigNumber(v)}€`)}
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
        {formatPDM(laboratory.margin_rate_percent)}
      </td>

      <td className="px-4 py-3 text-right align-top">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-900 font-medium">
            {formatPDM(laboratory.part_marche_ca_pct)}
          </span>
          {hasComparison && renderEvolution(laboratory.part_marche_ca_pct, laboratory.part_marche_ca_pct_comparison, formatPDM, true)}
        </div>
      </td>
    </tr>
  );
};