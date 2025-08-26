// src/components/molecules/ViewToggle/ViewToggle.tsx
'use client';

import React from 'react';
import type { ViewMode } from '../../organisms/ProductsTable/types';

interface ViewToggleProps {
  readonly currentView: ViewMode;
  readonly onViewChange: (view: ViewMode) => void;
  readonly className?: string;
}

/**
 * ViewToggle - Toggle entre vue Totaux et Moyennes
 * 
 * Features :
 * - Icônes Σ (totaux) et ⌀ (moyennes) 
 * - Style moderne avec état actif/inactif
 * - Transition smooth
 * - Accessible avec ARIA
 */
export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center bg-gray-100 rounded-lg p-1 ${className}`}>
      
      {/* Vue Totaux */}
      <button
        onClick={() => onViewChange('totals')}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-all duration-200
          ${currentView === 'totals'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
        aria-pressed={currentView === 'totals'}
        aria-label="Vue totaux"
      >
        <span className="text-base font-bold">Σ</span>
        <span>Totaux</span>
      </button>

      {/* Vue Moyennes */}
      <button
        onClick={() => onViewChange('averages')}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-all duration-200
          ${currentView === 'averages'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
        aria-pressed={currentView === 'averages'}
        aria-label="Vue moyennes"
      >
        <span className="text-base font-bold">⌀</span>
        <span>Moyennes</span>
      </button>
      
    </div>
  );
};