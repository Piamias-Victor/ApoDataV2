// src/hooks/generic-groups/useExportGenericProducts.ts
import { useState, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { CsvExporter } from '@/utils/export/csvExporter';

interface GenericProductExportData {
    readonly laboratory_name: string;
    readonly product_name: string;
    readonly code_ean: string;
    readonly prix_brut_grossiste: number | null;
    readonly avg_buy_price_ht: number;
    readonly remise_percent: number;
    readonly quantity_bought: number;
    readonly ca_achats: number;
    readonly quantity_sold: number;
    readonly ca_ventes: number;
    readonly margin_rate_percent: number;
}

interface UseExportGenericProductsReturn {
    readonly exportAllToCsv: (searchFilter?: string) => Promise<void>;
    readonly isExporting: boolean;
    readonly error: string | null;
}

export function useExportGenericProducts(
    dateRange: { start: string; end: string },
    productCodes: string[],
    isGlobalMode: boolean
): UseExportGenericProductsReturn {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pharmacyIds = useFiltersStore((state) => state.pharmacy);

    const exportAllToCsv = useCallback(async (searchFilter?: string) => {
        setIsExporting(true);
        setError(null);

        try {
            // Fetch ALL products without pagination
            const response = await fetch('/api/generic-groups/products-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dateRange,
                    productCodes: isGlobalMode ? [] : productCodes,
                    pharmacyIds,
                    page: 1,
                    pageSize: 999999, // Fetch all products
                    searchQuery: searchFilter || '',
                    sortColumn: 'quantity_sold',
                    sortDirection: 'desc',
                    showGlobalTop: isGlobalMode
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}`);
            }

            const result = await response.json();
            let exportProducts = result.products;

            if (exportProducts.length === 0) {
                setError('Aucune donnée à exporter');
                return;
            }

            // Prepare CSV data with raw values (not formatted)
            const exportData = exportProducts.map((product: GenericProductExportData) => ({
                'Laboratoire': product.laboratory_name,
                'Produit': product.product_name,
                'Code EAN': product.code_ean,
                'Prix Brut Grossiste (€)': product.prix_brut_grossiste !== null ? Number(product.prix_brut_grossiste) : null,
                'Prix Achat Moyen HT (€)': Number(product.avg_buy_price_ht),
                'Remise (%)': Number(product.remise_percent),
                'Volume Achats': Number(product.quantity_bought),
                'CA Achats (€)': Number(product.ca_achats),
                'Volume Ventes': Number(product.quantity_sold),
                'CA Ventes (€)': Number(product.ca_ventes),
                'Taux Marge (%)': Number(product.margin_rate_percent)
            }));

            const searchSuffix = searchFilter
                ? `_recherche_${searchFilter.replace(/[^a-zA-Z0-9]/g, '_')}`
                : '';
            const filename = CsvExporter.generateFilename(`apodata_produits_generiques${searchSuffix}`);
            const headers = Object.keys(exportData[0]!);

            CsvExporter.export({ filename, headers, data: exportData });

            console.log(`✅ Export CSV complet : ${exportProducts.length} produits génériques`);
        } catch (err) {
            console.error('❌ Erreur export:', err);
            setError('Erreur lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    }, [dateRange, productCodes, pharmacyIds, isGlobalMode]);

    return {
        exportAllToCsv,
        isExporting,
        error
    };
}
