// src/hooks/dashboard/useExportSalesProducts.ts
import { useState, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { CsvExporter } from '@/utils/export/csvExporter';

interface SalesProductExportData {
  readonly nom: string;
  readonly code_ean: string;
  readonly bcb_lab: string | null;
  readonly quantity_bought: number;
  readonly quantite_vendue: number;
  readonly quantite_vendue_comparison: number | null;
  readonly evol_quantite_pct: number | null;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly part_marche_quantite_pct: number;
  readonly part_marche_marge_pct: number;
  readonly montant_ventes_ttc: number;
  readonly montant_marge_total: number;
  readonly montant_ca_ht: number;
}

interface ExportResponse {
  readonly products: SalesProductExportData[];
  readonly total: number;
  readonly hasComparison: boolean;
  readonly queryTime: number;
}

interface UseExportSalesProductsReturn {
  readonly exportAllToCsv: (searchFilter?: string) => Promise<void>;
  readonly isExporting: boolean;
  readonly error: string | null;
}

export function useExportSalesProducts(): UseExportSalesProductsReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pharmacy = useFiltersStore((state) => state.pharmacy);
  const analysisDateRangeStart = useFiltersStore((state) => state.analysisDateRange.start);
  const analysisDateRangeEnd = useFiltersStore((state) => state.analysisDateRange.end);
  const comparisonDateRangeStart = useFiltersStore((state) => state.comparisonDateRange.start);
  const comparisonDateRangeEnd = useFiltersStore((state) => state.comparisonDateRange.end);
  const products = useFiltersStore((state) => state.products);

  const exportAllToCsv = useCallback(async (searchFilter?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/sales-products/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: {
            start: analysisDateRangeStart,
            end: analysisDateRangeEnd
          },
          comparisonDateRange: {
            start: comparisonDateRangeStart,
            end: comparisonDateRangeEnd
          },
          productCodes: products,
          laboratoryCodes: [],
          categoryCodes: [],
          pharmacyIds: pharmacy
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result: ExportResponse = await response.json();
      let exportProducts = result.products;

      // Appliquer filtre recherche si présent
      if (searchFilter?.trim()) {
        const query = searchFilter.toLowerCase();
        exportProducts = exportProducts.filter(product => {
          // Support recherche par fin de code (*1234)
          if (query.startsWith('*')) {
            const suffix = query.slice(1);
            return product.code_ean.endsWith(suffix);
          }
          return (
            product.nom.toLowerCase().includes(query) ||
            product.code_ean.toLowerCase().includes(query) ||
            (product.bcb_lab?.toLowerCase().includes(query) ?? false)
          );
        });
      }

      if (exportProducts.length === 0) {
        setError('Aucune donnée à exporter');
        return;
      }

      // ✅ Export avec valeurs BRUTES (non formatées)
      const exportData = exportProducts.map(product => {
        const baseData: Record<string, string | number | null> = {
          'Produit': product.nom,
          'Code EAN': product.code_ean,
          'Laboratoire': product.bcb_lab,
          'Quantité Achetée': product.quantity_bought,
          'Quantité Vendue': product.quantite_vendue,
        };

        if (result.hasComparison) {
          baseData['Quantité Vendue Comparaison'] = product.quantite_vendue_comparison;
          baseData['Évolution Qté (%)'] = product.evol_quantite_pct;
        }

        baseData['Prix Achat Moyen (€)'] = product.prix_achat_moyen;
        baseData['Prix Vente Moyen (€)'] = product.prix_vente_moyen;
        baseData['Taux Marge (%)'] = product.taux_marge_moyen;
        baseData['Part Marché Quantité (%)'] = product.part_marche_quantite_pct;
        baseData['Part Marché Marge (%)'] = product.part_marche_marge_pct;
        baseData['Montant TTC (€)'] = product.montant_ventes_ttc;
        baseData['Montant Marge (€)'] = product.montant_marge_total;
        baseData['Montant CA HT (€)'] = product.montant_ca_ht;

        return baseData;
      });

      const searchSuffix = searchFilter
        ? `_recherche_${searchFilter.replace(/[^a-zA-Z0-9]/g, '_')}`
        : '';
      const filename = CsvExporter.generateFilename(`apodata_ventes_complet${searchSuffix}`);
      const headers = Object.keys(exportData[0]!);

      CsvExporter.export({ filename, headers, data: exportData });

      console.log(`✅ Export CSV complet : ${exportProducts.length} produits`);
    } catch (err) {
      console.error('❌ Erreur export:', err);
      setError('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  }, [
    products,
    pharmacy,
    analysisDateRangeStart,
    analysisDateRangeEnd,
    comparisonDateRangeStart,
    comparisonDateRangeEnd
  ]);

  return {
    exportAllToCsv,
    isExporting,
    error
  };
}