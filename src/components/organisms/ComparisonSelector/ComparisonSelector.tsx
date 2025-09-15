// src/components/organisms/ComparisonSelector/ComparisonSelector.tsx
'use client';

import React, { useCallback } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { TypeSelector } from '@/components/molecules/TypeSelector/TypeSelector';
import { ComparisonCard } from '@/components/molecules/ComparisonCard/ComparisonCard';
import { ElementSearchModal } from '@/components/molecules/ElementSearchModal/ElementSearchModal';
import { Button } from '@/components/atoms/Button/Button';
import { useComparisonStore } from '@/stores/useComparisonStore';
import type { ComparisonType } from '@/types/comparison';

interface ComparisonSelectorProps {
  readonly className?: string;
}

/**
 * ComparisonSelector - Interface complète sélection comparaisons
 * 
 * Layout :
 * - TypeSelector (3 cards)
 * - ComparisonCards A/B/C (grid 3 colonnes)
 * - Actions : Comparer + Swap + Clear
 * 
 * Responsive : Stack mobile, grid desktop
 * UX : Workflow linéaire 3 clics max
 * Performance : useCallback optimisations
 */
export const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({
  className = '',
}) => {
  
  const {
    comparisonType,
    elementA,
    elementB,
    elementC,
    isModalOpen,
    modalTarget,
    setComparisonType,
    setElementA,
    setElementB,
    setElementC,
    swapElements,
    clearAll,
    clearElement,
    openModal,
    closeModal,
    canCompare,
  } = useComparisonStore();

  // Handlers optimisés
  const handleTypeSelect = useCallback((type: ComparisonType) => {
    setComparisonType(type);
  }, [setComparisonType]);

  const handleCardSelect = useCallback((position: 'A' | 'B' | 'C') => {
    openModal(position);
  }, [openModal]);

  const handleElementSelect = useCallback((element: any) => {
    if (modalTarget === 'A') setElementA(element);
    else if (modalTarget === 'B') setElementB(element);
    else if (modalTarget === 'C') setElementC(element);
    closeModal();
  }, [modalTarget, setElementA, setElementB, setElementC, closeModal]);

  const handleSwap = useCallback(() => {
    swapElements();
  }, [swapElements]);

  const handleClear = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleCompare = useCallback(() => {
    if (canCompare()) {
      console.log('✅ Comparaison sauvegardée dans le store:', {
        type: comparisonType,
        elementA: elementA?.name,
        elementB: elementB?.name,
        elementC: elementC?.name,
      });
    }
  }, [canCompare, comparisonType, elementA, elementB, elementC]);

  const canSwap = elementA && elementB;
  const hasAnySelection = comparisonType || elementA || elementB || elementC;
  const selectedCount = [elementA, elementB, elementC].filter(Boolean).length;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Type Selector avec header cohérent */}
      <TypeSelector
        selectedType={comparisonType}
        onTypeSelect={handleTypeSelect}
      />

      {/* Section Éléments A/B/C */}
      {comparisonType && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              2. Sélectionnez les éléments à comparer
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Minimum 2 éléments, maximum 3 • {selectedCount}/3 sélectionnés
            </p>
          </div>
          
          {/* Grid 3 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ComparisonCard
              position="A"
              element={elementA}
              comparisonType={comparisonType}
              onSelect={() => handleCardSelect('A')}
              onClear={() => clearElement('A')}
            />

            <ComparisonCard
              position="B"
              element={elementB}
              comparisonType={comparisonType}
              onSelect={() => handleCardSelect('B')}
              onClear={() => clearElement('B')}
            />

            <ComparisonCard
              position="C"
              element={elementC}
              comparisonType={comparisonType}
              onSelect={() => handleCardSelect('C')}
              onClear={() => clearElement('C')}
            />
          </div>

          {/* Actions Bar */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Actions secondaires */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSwap}
                  disabled={!canSwap}
                  iconLeft={<RefreshCw className="w-4 h-4" />}
                >
                  Échanger A↔B
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClear}
                  disabled={!hasAnySelection}
                  iconLeft={<Trash2 className="w-4 h-4" />}
                >
                  Tout effacer
                </Button>
              </div>

              {/* Action principale */}
              <Button
                variant="primary"
                size="md"
                onClick={handleCompare}
                disabled={!canCompare()}
                className="w-full sm:w-auto min-w-[160px] font-semibold"
              >
                Comparer les éléments ({selectedCount})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && modalTarget && comparisonType && (
        <ElementSearchModal
          isOpen={isModalOpen}
          comparisonType={comparisonType}
          targetPosition={modalTarget}
          onClose={closeModal}
          onSelect={handleElementSelect}
        />
      )}
    </div>
  );
};