// src/components/organisms/LaboratoryMarketShareSection/LaboratoryMarketShareSection.tsx
'use client';

import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLaboratoryMarketShare } from '@/hooks/generic-groups/useLaboratoryMarketShare';
import { Button } from '@/components/atoms/Button/Button';

interface LaboratoryMarketShareSectionProps {
  readonly productCodes: string[];
  readonly dateRange: { start: string; end: string };
}

export const LaboratoryMarketShareSection: React.FC<LaboratoryMarketShareSectionProps> = ({
  productCodes,
  dateRange
}) => {
  const {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage
  } = useLaboratoryMarketShare({
    enabled: true,
    productCodes,
    dateRange,
    pageSize: 10
  });

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((percentage: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  }, []);

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
            <div className="h-3 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée disponible pour ce groupe
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((lab) => (
        <div key={lab.laboratory_name} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-4">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  {lab.laboratory_name}
                </h4>
                {/* {lab.is_referent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    <Award className="w-3 h-3 mr-1" />
                    Référent
                  </span>
                )} */}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {lab.product_count} produit{lab.product_count > 1 ? 's' : ''} dans ce groupe
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(lab.ca_selection)}
              </div>
              <div className="text-xs text-gray-500">CA Réalisé</div>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Part Marché CA</span>
              <span className="text-sm font-semibold text-sky-600">
                {formatPercentage(lab.part_marche_ca_pct)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-sky-500 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, lab.part_marche_ca_pct)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Part Marché Marge</span>
              <span className="text-sm font-semibold text-green-600">
                {formatPercentage(lab.part_marche_marge_pct)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, lab.part_marche_marge_pct)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Marge: {formatCurrency(lab.marge_selection)}
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages} • {total} laboratoires
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousPage}
              disabled={!canPreviousPage}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Précédent
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={!canNextPage}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};