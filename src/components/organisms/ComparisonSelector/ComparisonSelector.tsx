// src/components/organisms/ComparisonSelector/ComparisonSelector.tsx
'use client';

import React, { useCallback } from 'react';
import { ArrowLeftRight, RefreshCw, Trash2 } from 'lucide-react';
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
 * - Divider "VS" avec cercle + ArrowLeftRight
 * - ComparisonCards A/B
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
    isModalOpen,
    modalTarget,
    setComparisonType,
    setElementA,
    setElementB,
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

  const handleCardSelect = useCallback((position: 'A' | 'B') => {
    openModal(position);
  }, [openModal]);

  const handleElementSelect = useCallback((element: any) => {
    if (modalTarget === 'A') {
      setElementA(element);
    } else if (modalTarget === 'B') {
      setElementB(element);
    }
    closeModal();
  }, [modalTarget, setElementA, setElementB, closeModal]);

  const handleSwap = useCallback(() => {
    swapElements();
  }, [swapElements]);

  const handleClear = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleCompare = useCallback(() => {
    // Juste sauvegarder dans le store, pas de navigation
    if (canCompare()) {
      console.log('✅ Comparaison sauvegardée dans le store:', {
        type: comparisonType,
        elementA: elementA?.name,
        elementB: elementB?.name
      });
      
      // Optionnel : notification utilisateur
      // toast.success('Comparaison sauvegardée');
    }
  }, [canCompare, comparisonType, elementA, elementB]);

  const canSwap = elementA && elementB;
  const hasAnySelection = comparisonType || elementA || elementB;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Type Selector avec header cohérent */}
      <TypeSelector
        selectedType={comparisonType}
        onTypeSelect={handleTypeSelect}
      />

      {/* Section Éléments A/B */}
      {comparisonType && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              2. Sélectionnez les éléments à comparer
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choisissez deux éléments différents pour les comparer
            </p>
          </div>
          
          {/* Cards A/B avec divider VS */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card A */}
              <ComparisonCard
                position="A"
                element={elementA}
                comparisonType={comparisonType}
                onSelect={() => handleCardSelect('A')}
                onClear={() => clearElement('A')}
              />

              {/* Card B */}
              <ComparisonCard
                position="B"
                element={elementB}
                comparisonType={comparisonType}
                onSelect={() => handleCardSelect('B')}
                onClear={() => clearElement('B')}
              />
            </div>

            {/* Divider VS - Desktop only */}
            <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-white border-2 border-gray-200 rounded-full p-3 shadow-md">
                <ArrowLeftRight className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* Divider VS - Mobile */}
            <div className="lg:hidden flex items-center justify-center py-6">
              <div className="flex items-center space-x-3 text-gray-500">
                <div className="h-px bg-gray-200 flex-1" />
                <div className="bg-white border border-gray-200 rounded-full p-2 shadow-sm">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
            </div>
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
                  Échanger
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
                Comparer les éléments
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