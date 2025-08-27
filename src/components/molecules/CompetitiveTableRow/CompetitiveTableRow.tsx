// src/components/molecules/CompetitiveTableRow/CompetitiveTableRow.tsx
'use client';

import React from 'react';
import type { CompetitiveMetrics } from '../../organisms/CompetitiveTable/types';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  getCompetitiveColorClass, 
  getMarginColorClass 
} from '../../organisms/CompetitiveTable/utils';

interface CompetitiveTableRowProps {
  readonly product: CompetitiveMetrics;
  readonly isEven: boolean;
  readonly className?: string;
}

/**
 * CompetitiveTableRow - Ligne données analyse concurrentielle
 * 
 * Features :
 * - Formatage intelligent prix/quantités (12K, 1.2M)
 * - Couleurs conditionnelles écart concurrentiel
 * - Couleurs marges métier pharma (vert >30%, orange 20-30%, rouge <20%)
 * - Alternance couleurs lignes
 * - Hover states UX
 * - 11 colonnes données concurrentielles
 */
export const CompetitiveTableRow: React.FC<CompetitiveTableRowProps> = ({
  product,
  isEven,
  className = ''
}) => {
  const competitiveColorClass = getCompetitiveColorClass(product.ecart_prix_vs_marche_pct);
  const marginColorClass = getMarginColorClass(product.taux_marge_moyen_selection);

  const rowBgClass = isEven 
    ? 'bg-white hover:bg-gray-50' 
    : 'bg-gray-25 hover:bg-gray-50';

  return (
    <tr className={`
      border-b border-gray-100 transition-colors duration-150
      ${rowBgClass}
      ${className}
    `}>
      
      {/* Nom produit */}
      <td 
        className="px-4 py-3 text-sm text-gray-900 font-medium"
        style={{ 
          width: '11.5%',
          maxWidth: '11.5%',
          minWidth: '11.5%'
        }}
      >
        <div className="truncate" title={product.product_name}>
          {product.product_name}
        </div>
      </td>
      
      {/* Code EAN */}
      <td 
        className="px-4 py-3 text-sm text-gray-600 font-mono"
        style={{ 
          width: '14.5%',
          maxWidth: '14.5%',
          minWidth: '14.5%'
        }}
      >
        {product.code_ean}
      </td>
      
      {/* Prix minimum global */}
      <td 
        className="px-4 py-3 text-sm text-gray-900 text-right font-medium"
        style={{ 
          width: '10%',
          maxWidth: '10%',
          minWidth: '10%'
        }}
      >
        {formatCurrency(product.prix_vente_min_global)}
      </td>
      
      {/* Prix maximum global */}
      <td 
        className="px-4 py-3 text-sm text-gray-900 text-right font-medium"
        style={{ 
          width: '10%',
          maxWidth: '10%',
          minWidth: '10%'
        }}
      >
        {formatCurrency(product.prix_vente_max_global)}
      </td>
      
      {/* Prix moyen global (marché) */}
      <td 
        className="px-4 py-3 text-sm text-gray-900 text-right font-medium"
        style={{ 
          width: '11.5%',
          maxWidth: '11.5%',
          minWidth: '11.5%'
        }}
      >
        {formatCurrency(product.prix_vente_moyen_global)}
      </td>
      
      {/* Mon prix vente moyen */}
      <td 
        className="px-4 py-3 text-sm text-gray-900 text-right font-medium"
        style={{ 
          width: '12%',
          maxWidth: '12%',
          minWidth: '12%'
        }}
      >
        {formatCurrency(product.prix_vente_moyen_selection)}
      </td>
      
      {/* Mon prix achat moyen */}
      <td 
        className="px-4 py-3 text-sm text-gray-600 text-right"
        style={{ 
          width: '12%',
          maxWidth: '12%',
          minWidth: '12%'
        }}
      >
        {formatCurrency(product.prix_achat_moyen_ht)}
      </td>
      
      {/* Mon taux marge avec couleur conditionnelle */}
      <td 
        className="px-4 py-3 text-sm text-right"
        style={{ 
          width: '10.5%',
          maxWidth: '10.5%',
          minWidth: '10.5%'
        }}
      >
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${marginColorClass}
        `}>
          {formatPercentage(product.taux_marge_moyen_selection)}
        </span>
      </td>
      
      {/* Écart vs marché avec couleur conditionnelle */}
      <td 
        className="px-4 py-3 text-sm text-right"
        style={{ 
          width: '10.5%',
          maxWidth: '10.5%',
          minWidth: '10.5%'
        }}
      >
        <span className={`
          px-2 py-1 rounded-full text-xs font-bold
          ${competitiveColorClass}
        `}>
          {formatPercentage(product.ecart_prix_vs_marche_pct, true)}
        </span>
      </td>
      
    </tr>
  );
};