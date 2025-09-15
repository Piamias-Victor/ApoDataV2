// src/components/molecules/ComparisonCard/ComparisonCard.tsx
'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Button } from '@/components/atoms/Button/Button';
import type { ComparisonElement, ComparisonType } from '@/types/comparison';

interface ComparisonCardProps {
  readonly position: 'A' | 'B' | 'C';
  readonly element: ComparisonElement | null;
  readonly comparisonType: ComparisonType | null;
  readonly onSelect: () => void;
  readonly onClear: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * ComparisonCard - Card sélection élément A, B ou C
 * 
 * États :
 * - Vide : Icône Plus + "Sélectionner [type]" + bouton primary
 * - Rempli : Badge position + nom + métadonnées + bouton X
 * - Hover : shadow + transform subtle
 * 
 * Design Apple : card blanche, border subtle, micro-interactions
 */
export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  position,
  element,
  comparisonType,
  onSelect,
  onClear,
  disabled = false,
  className = '',
}) => {
  const isEmpty = !element;
  const badgeVariant = position === 'A' ? 'primary' : 
                      position === 'B' ? 'gradient-purple' : 
                      'gradient-green';
  
  // Labels selon type
  const getTypeLabel = () => {
    if (!comparisonType) return 'élément';
    
    switch (comparisonType) {
      case 'products':
        return 'produit';
      case 'laboratories':
        return 'laboratoire';
      case 'categories':
        return 'catégorie';
      default:
        return 'élément';
    }
  };

  // Métadonnées formatées selon type
  const formatMetadata = () => {
    if (!element) return null;
    
    const { metadata } = element;
    
    switch (element.type) {
      case 'product':
        return (
          <div className="space-y-1 text-xs text-gray-500">
            {metadata.code_ean && (
              <div className="flex justify-between">
                <span>Code EAN:</span>
                <span className="font-medium text-gray-700 font-mono">{metadata.code_ean}</span>
              </div>
            )}
            {metadata.brand_lab && (
              <div className="flex justify-between">
                <span>Laboratoire:</span>
                <span className="font-medium text-gray-700">{metadata.brand_lab}</span>
              </div>
            )}
            {metadata.universe && (
              <div className="flex justify-between">
                <span>Univers:</span>
                <span className="font-medium text-gray-700">{metadata.universe}</span>
              </div>
            )}
          </div>
        );
        
      case 'laboratory':
        return (
          <div className="text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Produits:</span>
              <span className="font-medium text-gray-700">{metadata.product_codes.length}</span>
            </div>
          </div>
        );
        
      case 'category':
        return (
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-medium text-gray-700">
                {metadata.category_type === 'universe' ? 'Univers' : 'Catégorie'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Produits:</span>
              <span className="font-medium text-gray-700">{metadata.product_codes.length}</span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isEmpty) {
    return (
      <Card
        variant="interactive"
        padding="lg"
        {...(disabled ? {} : { onClick: onSelect })}
        className={`
          min-h-[120px] flex flex-col items-center justify-center
          text-center space-y-3 transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        <Badge variant={badgeVariant} size="sm">
          {position}
        </Badge>
        
        <div className="flex flex-col items-center space-y-2">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
            <Plus className="w-5 h-5" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              Sélectionner {getTypeLabel()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {position === 'C' ? 'Optionnel' : 'Cliquer pour rechercher'}
            </p>
          </div>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          {...(disabled ? {} : { onClick: onSelect })}
        >
          Rechercher
        </Button>
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="md"
      className={`
        min-h-[140px] relative transition-all duration-200 hover:shadow-md 
        border-gray-200 bg-white ${className}
      `}
    >
      {/* Badge position */}
      <div className="absolute top-3 left-3">
        <Badge variant={badgeVariant} size="md">
          {position}
        </Badge>
      </div>
      
      {/* Bouton suppression */}
      <button
        onClick={onClear}
        className="
          absolute top-3 right-3 p-1.5 rounded-full
          bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600
          transition-colors duration-200 hover:shadow-sm
        "
        title="Supprimer la sélection"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Contenu */}
      <div className="pt-8 space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
            {element.name}
          </h3>
        </div>
        
        <div className="space-y-2">
          {formatMetadata()}
        </div>
        
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSelect}
            className="w-full"
          >
            Modifier la sélection
          </Button>
        </div>
      </div>
    </Card>
  );
};