import { useMemo } from 'react';

/**
 * Hook to calculate rank dynamically based on a specific field.
 * Returns a Map where key = item identifier (id, ean13, or name) and value = rank (1-based).
 */
export const useCalculatedRank = <T>(
    data: T[], 
    rankBasis: keyof T, 
    idGetter: (item: T) => string | number
) => {
    return useMemo(() => {
        if (!data || data.length === 0) return new Map<string | number, number>();

        // Create a shallow copy and sort by the chosen basis in descending order (highest first)
        const sorted = [...data].sort((a: any, b: any) => {
            const valA = a[rankBasis] ?? 0; // Handle nulls as 0
            const valB = b[rankBasis] ?? 0;
            return valB - valA;
        });

        const rankMap = new Map<string | number, number>();
        sorted.forEach((item, index) => {
            const id = idGetter(item);
            rankMap.set(id, index + 1);
        });

        return rankMap;
    }, [data, rankBasis, idGetter]);
};
