// src/hooks/priceIncrease/usePriceComparison.ts
'use client';

import { useMemo } from 'react';
import type { CatalogProduct } from '@/types/priceIncrease';

interface UsePriceComparisonReturn {
    readonly comparisons: Map<string, { prix_2025: number; prix_2026: number; hausse_pourcent: number; hausse_euros: number }>;
    readonly matchedCount: number;
    readonly unmatchedIn2025: string[];
    readonly unmatchedIn2026: string[];
}

/**
 * Hook pour comparer les prix entre 2 catalogues
 */
export function usePriceComparison(
    catalog2025: CatalogProduct[] | null,
    catalog2026: CatalogProduct[] | null
): UsePriceComparisonReturn {
    return useMemo(() => {
        if (!catalog2025 || !catalog2026) {
            return {
                comparisons: new Map(),
                matchedCount: 0,
                unmatchedIn2025: [],
                unmatchedIn2026: []
            };
        }

        // Créer des maps pour accès rapide
        const map2025 = new Map(catalog2025.map(p => [p.code_ean, p.prix_ht]));
        const map2026 = new Map(catalog2026.map(p => [p.code_ean, p.prix_ht]));

        const comparisons = new Map<string, { prix_2025: number; prix_2026: number; hausse_pourcent: number; hausse_euros: number }>();
        const unmatchedIn2025: string[] = [];
        const unmatchedIn2026: string[] = [];

        // Comparer les produits
        map2025.forEach((prix2025, codeEan) => {
            const prix2026 = map2026.get(codeEan);

            if (prix2026 !== undefined) {
                const hausse_euros = prix2026 - prix2025;
                const hausse_pourcent = prix2025 > 0 ? (hausse_euros / prix2025) * 100 : 0;

                comparisons.set(codeEan, {
                    prix_2025: prix2025,
                    prix_2026: prix2026,
                    hausse_pourcent,
                    hausse_euros
                });
            } else {
                unmatchedIn2026.push(codeEan);
            }
        });

        // Trouver les produits dans 2026 mais pas dans 2025
        map2026.forEach((_, codeEan) => {
            if (!map2025.has(codeEan)) {
                unmatchedIn2025.push(codeEan);
            }
        });

        return {
            comparisons,
            matchedCount: comparisons.size,
            unmatchedIn2025,
            unmatchedIn2026
        };
    }, [catalog2025, catalog2026]);
}
