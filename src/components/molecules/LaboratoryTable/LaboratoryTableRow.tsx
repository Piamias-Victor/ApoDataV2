// src/components/molecules/LaboratoryTable/LaboratoryTableRow.tsx
'use client';

import React from 'react';
import type { LaboratoryMarketShareData } from '@/components/organisms/LaboratoryMarketShareSection/types';

interface LaboratoryTableRowProps {
  readonly laboratory: LaboratoryMarketShareData;
  readonly isEven: boolean;
}

export const LaboratoryTableRow: React.FC<LaboratoryTableRowProps> = ({
  laboratory,
  isEven
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  };

  const rowClass = `${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`;

  return (
    <tr className={rowClass}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {laboratory.laboratory_name}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-700">
        {laboratory.product_count}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
        {formatCurrency(laboratory.ca_selection)}
      </td>
      
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
        {formatCurrency(laboratory.marge_selection)}
      </td>
      
      <td className="px-4 py-3 text-sm text-sky-600 font-semibold">
        {formatPercentage(laboratory.part_marche_ca_pct)}
      </td>
      
      <td className="px-4 py-3 text-sm text-green-600 font-semibold">
        {formatPercentage(laboratory.part_marche_marge_pct)}
      </td>
    </tr>
  );
};