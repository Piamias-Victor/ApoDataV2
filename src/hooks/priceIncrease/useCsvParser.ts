// src/hooks/priceIncrease/useCsvParser.ts
'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { CatalogProduct } from '@/types/priceIncrease';

interface UseCsvParserReturn {
    readonly parseCsv: (file: File) => Promise<CatalogProduct[]>;
    readonly isLoading: boolean;
    readonly error: string | null;
}

/**
 * Hook pour parser un fichier CSV de catalogue
 * Format attendu : code_ean, prix_ht
 */
export function useCsvParser(): UseCsvParserReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseCsv = useCallback(async (file: File): Promise<CatalogProduct[]> => {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: false, // Pas d'en-tête
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    try {
                        const products: CatalogProduct[] = [];
                        const errors: string[] = [];

                        results.data.forEach((row: any, index: number) => {
                            // Colonne 1 = code EAN, Colonne 2 = prix HT
                            const codeEan = row[0];
                            const prixHt = row[1];

                            if (!codeEan || !prixHt) {
                                errors.push(`Ligne ${index + 1}: Données manquantes`);
                                return;
                            }

                            // Validation code EAN
                            const eanStr = typeof codeEan === 'string' ? codeEan : String(codeEan);
                            if (eanStr.trim() === '') {
                                errors.push(`Ligne ${index + 1}: Code EAN vide`);
                                return;
                            }

                            // Validation prix
                            const prix = typeof prixHt === 'number' ? prixHt : parseFloat(prixHt);
                            if (isNaN(prix) || prix < 0) {
                                errors.push(`Ligne ${index + 1}: Prix invalide`);
                                return;
                            }

                            products.push({
                                code_ean: eanStr.trim(),
                                prix_ht: prix
                            });
                        });

                        if (errors.length > 0 && products.length === 0) {
                            const errorMsg = `Erreurs de parsing:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... et ${errors.length - 5} autres erreurs` : ''}`;
                            setError(errorMsg);
                            setIsLoading(false);
                            reject(new Error(errorMsg));
                            return;
                        }

                        if (products.length === 0) {
                            const errorMsg = 'Aucun produit valide trouvé dans le fichier';
                            setError(errorMsg);
                            setIsLoading(false);
                            reject(new Error(errorMsg));
                            return;
                        }

                        console.log(`✅ CSV parsé: ${products.length} produits`, errors.length > 0 ? `(${errors.length} lignes ignorées)` : '');
                        setIsLoading(false);
                        resolve(products);
                    } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : 'Erreur de parsing';
                        setError(errorMsg);
                        setIsLoading(false);
                        reject(err);
                    }
                },
                error: (err) => {
                    const errorMsg = `Erreur de lecture du fichier: ${err.message}`;
                    setError(errorMsg);
                    setIsLoading(false);
                    reject(new Error(errorMsg));
                }
            });
        });
    }, []);

    return {
        parseCsv,
        isLoading,
        error
    };
}
