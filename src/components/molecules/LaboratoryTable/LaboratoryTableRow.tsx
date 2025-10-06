// src/components/molecules/LaboratoryTable/LaboratoryTableRow.tsx
import React from 'react';
import type { LaboratoryMarketShare } from '@/types/laboratory';

interface LaboratoryTableRowProps {
  laboratory: LaboratoryMarketShare;
  isEven: boolean;
}

export const LaboratoryTableRow: React.FC<LaboratoryTableRowProps> = ({
  laboratory,
  isEven
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined, decimals: number = 2) => {
    const numValue = Number(value) || 0;
    return `${numValue.toFixed(decimals)} %`;
  };

  const formatNumber = (value: number | null | undefined) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('fr-FR').format(numValue);
  };

  return (
    <tr className={isEven ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {laboratory.laboratory_name}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatNumber(laboratory.product_count)}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700">
        {formatNumber(laboratory.quantity_sold)}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700">
        {formatPercent(laboratory.margin_rate_percent, 1)}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatCurrency(laboratory.ca_selection)}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatCurrency(laboratory.marge_selection)}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatPercent(laboratory.part_marche_ca_pct)}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatPercent(laboratory.part_marche_marge_pct)}
      </td>
    </tr>
  );
};