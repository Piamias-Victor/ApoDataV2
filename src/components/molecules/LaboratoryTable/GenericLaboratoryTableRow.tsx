// src/components/molecules/LaboratoryTable/GenericLaboratoryTableRow.tsx
import React from 'react';
import { Badge } from '@/components/atoms/Badge/Badge';
import type { LaboratoryMarketShare } from '@/types/laboratory';

interface GenericLaboratoryTableRowProps {
  readonly laboratory: LaboratoryMarketShare;
  readonly isEven: boolean;
}

export const GenericLaboratoryTableRow: React.FC<GenericLaboratoryTableRowProps> = ({
  laboratory,
  isEven
}) => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(value));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)} %`;
  };

  const rowClass = `${isEven ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/50 transition-colors`;
  const cellClass = "px-4 py-3 text-sm";

  return (
    <tr className={rowClass}>
      {/* Laboratoire */}
      <td className={`${cellClass} font-medium text-gray-900`}>
        <div className="flex items-center space-x-2">
          <span>{laboratory.laboratory_name}</span>
          {laboratory.is_referent && (
            <Badge variant="primary" size="sm">
              Référent
            </Badge>
          )}
        </div>
      </td>

      {/* Nb Produits */}
      <td className={`${cellClass} text-center text-gray-700 font-medium`}>
        {laboratory.product_count}
      </td>

      {/* ACHATS */}
      <td className={`${cellClass} text-right text-gray-900 font-medium`}>
        {formatNumber(laboratory.quantity_bought)}
      </td>

      <td className={`${cellClass} text-right text-gray-900 font-semibold`}>
        {formatCurrency(laboratory.ca_achats)}
      </td>

      <td className={`${cellClass} text-right`}>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
          {formatPercent(laboratory.part_marche_achats_pct || 0)}
        </span>
      </td>

      {/* MARGE */}
      <td className={`${cellClass} text-right`}>
        <span className={`font-semibold ${
          laboratory.margin_rate_percent >= 30 ? 'text-green-600' :
          laboratory.margin_rate_percent >= 20 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {Number(laboratory.margin_rate_percent || 0).toFixed(1)} %
        </span>
      </td>

      {/* VENTES */}
      <td className={`${cellClass} text-right text-gray-900 font-medium`}>
        {formatNumber(laboratory.quantity_sold)}
      </td>

      <td className={`${cellClass} text-right text-gray-900 font-semibold`}>
        {formatCurrency(laboratory.ca_selection)}
      </td>

      <td className={`${cellClass} text-right`}>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {formatPercent(laboratory.part_marche_ca_pct)}
        </span>
      </td>
    </tr>
  );
};