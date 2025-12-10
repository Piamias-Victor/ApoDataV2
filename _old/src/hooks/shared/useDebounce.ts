// src/hooks/shared/useDebounce.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook pour debounce une valeur
 * @param value - Valeur à debouncer
 * @param delay - Délai en millisecondes
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}