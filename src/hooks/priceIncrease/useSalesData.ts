// src/hooks/priceIncrease/useSalesData.ts
'use client';

import { useState, useCallback } from 'react';

interface ProductSalesData {
    code_ean: string;
    nom_produit: string;
    laboratoire: string;
    quantite_vendue: number;
    ca_ttc: number;
    prix_vente_moyen_ttc: number;
    prix_achat_moyen_ht: number;
}

interface UseSalesDataReturn {
    readonly fetchSalesData: (codeEans: string[], dateStart: string, dateEnd: string) => Promise<Map<string, ProductSalesData>>;
    readonly isLoading: boolean;
    readonly error: string | null;
}

/**
 * Hook pour récupérer les données de vente
 */
export function useSalesData(): UseSalesDataReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSalesData = useCallback(async (
        codeEans: string[],
        dateStart: string,
        dateEnd: string
    ): Promise<Map<string, ProductSalesData>> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/price-increase/sales-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code_eans: codeEans,
                    date_start: dateStart,
                    date_end: dateEnd
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            // Convertir en Map pour accès rapide
            const salesMap = new Map<string, ProductSalesData>();
            result.data.forEach((item: ProductSalesData) => {
                salesMap.set(item.code_ean, item);
            });

            setIsLoading(false);
            return salesMap;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Erreur de récupération des ventes';
            setError(errorMsg);
            setIsLoading(false);
            throw err;
        }
    }, []);

    return {
        fetchSalesData,
        isLoading,
        error
    };
}
