// src/components/filters/FilterTypeBadge.tsx
import React from 'react';
import type { FilterType } from '@/types/savedFilters';

interface FilterTypeBadgeProps {
  readonly type: FilterType;
  readonly className?: string;
}

export function FilterTypeBadge({ type, className = '' }: FilterTypeBadgeProps): React.ReactElement {
  if (type === 'classic') {
    return (
      <span 
        className={`
          inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
          bg-blue-100 text-blue-800
          ${className}
        `}
      >
        Classique
      </span>
    );
  }

  return (
    <span 
      className={`
        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
        bg-purple-100 text-purple-800
        ${className}
      `}
    >
      Générique
    </span>
  );
}