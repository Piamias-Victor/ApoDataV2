// src/hooks/shared/useDebounce.ts
import { useCallback, useRef } from 'react';

/**
 * Hook useDebounce - Debounce pour fonctions avec cleanup
 * 
 * Utilisé pour optimiser les recherches et éviter les requêtes excessives
 * Cleanup automatique des timeouts lors du démontage
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    // Cleanup timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Nouveau timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  return debouncedCallback;
}