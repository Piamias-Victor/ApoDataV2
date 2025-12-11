// src/hooks/useCancelableSearch.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook for cancelable search with debouncing and AbortController
 * Prevents race conditions when search query changes rapidly
 * 
 * @param searchQuery - The search query string
 * @param fetchFn - Async function that performs the fetch (receives query and AbortSignal)
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Object with results, isLoading, and error states
 */
export function useCancelableSearch<T>(
    searchQuery: string,
    fetchFn: (query: string, signal: AbortSignal) => Promise<T>,
    debounceMs: number = 300
) {
    const [results, setResults] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await fetchFn(searchQuery, controller.signal);
                setResults(data);
            } catch (err) {
                // Ignore AbortError - it's expected when query changes
                if ((err as Error).name === 'AbortError') {
                    return;
                }
                setError(err as Error);
                console.error('Search error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchData, debounceMs);

        // Cleanup: cancel timeout and abort ongoing request
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery, fetchFn, debounceMs]);

    return { results, isLoading, error };
}
