// src/hooks/laboratories/useExportLaboratoryMarketShare.ts
import { useState, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { CsvExporter } from '@/utils/export/csvExporter';

interface LaboratoryExportData {
  readonly laboratory_name: string;
  readonly product_count: number;
  readonly rang_actuel: number;
  readonly rang_precedent: number | null;
  readonly gain_rang: number | null;
  readonly quantity_bought: number;
  readonly ca_achats: number;
  readonly ca_achats_comparison: number | null;
  readonly evol_achats_pct: number | null;
  readonly quantity_sold: number;
  readonly ca_selection: number;
  readonly ca_selection_comparison: number | null;
  readonly evol_ventes_pct: number | null;
  readonly part_marche_ca_pct: number;
  readonly part_marche_ca_pct_comparison: number | null;
  readonly evol_pdm_pct: number | null;
  readonly margin_rate_percent: number;
  readonly is_referent: boolean;
}

interface ExportResponse {
  readonly laboratories: LaboratoryExportData[];
  readonly total: number;
  readonly hasComparison: boolean;
}

interface UseExportLaboratoryMarketShareReturn {
  readonly exportAllToCsv: (searchFilter?: string) => Promise<void>;
  readonly isExporting: boolean;
  readonly error: string | null;
}

export function useExportLaboratoryMarketShare(): UseExportLaboratoryMarketShareReturn {
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
      const response = await fetch('/api/laboratory/market-share/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            productCodes: products,
            pharmacyIds: pharmacy,
            dateRange: {
              start: analysisDateRangeStart,
              end: analysisDateRangeEnd
            },
            comparisonDateRange: {
              start: comparisonDateRangeStart,
              end: comparisonDateRangeEnd
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result: ExportResponse = await response.json();
      let laboratories = result.laboratories;

      // Appliquer filtre recherche si présent
      if (searchFilter?.trim()) {
        const query = searchFilter.toLowerCase();
        laboratories = laboratories.filter(lab =>
          lab.laboratory_name.toLowerCase().includes(query)
        );
      }

      if (laboratories.length === 0) {
        setError('Aucune donnée à exporter');
        return;
      }

      // ✅ Export avec valeurs BRUTES (non formatées)
      const exportData = laboratories.map(lab => {
        const baseData: Record<string, string | number | null> = {
          'Laboratoire': lab.laboratory_name,
          'Rang': lab.rang_actuel,
        };

        if (result.hasComparison) {
          baseData['Rang Précédent'] = lab.rang_precedent;
          baseData['Gain Rang'] = lab.gain_rang;
        }

        baseData['Nb Produits'] = lab.product_count;
        baseData['Volume Achats'] = lab.quantity_bought;
        baseData['Montant Achats (€)'] = lab.ca_achats;

        if (result.hasComparison) {
          baseData['Montant Achats Comparaison (€)'] = lab.ca_achats_comparison;
          baseData['Évolution Achats € (%)'] = lab.evol_achats_pct;
        }

        baseData['Volume Ventes'] = lab.quantity_sold;
        baseData['Montant Ventes (€)'] = lab.ca_selection;

        if (result.hasComparison) {
          baseData['Montant Ventes Comparaison (€)'] = lab.ca_selection_comparison;
          baseData['Évolution Ventes € (%)'] = lab.evol_ventes_pct;
        }

        baseData['Taux Marge (%)'] = lab.margin_rate_percent;
        baseData['PDM (%)'] = lab.part_marche_ca_pct;

        if (result.hasComparison) {
          baseData['PDM Comparaison (%)'] = lab.part_marche_ca_pct_comparison;
          baseData['Évolution PDM (pts)'] = lab.evol_pdm_pct;
        }

        baseData['Est Référent'] = lab.is_referent ? 'Oui' : 'Non';

        return baseData;
      });

      const filename = CsvExporter.generateFilename('apodata_laboratoires_ranking_complet');
      const headers = Object.keys(exportData[0]!);

      CsvExporter.export({ filename, headers, data: exportData });

      console.log(`✅ Export CSV complet : ${laboratories.length} laboratoires`);
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