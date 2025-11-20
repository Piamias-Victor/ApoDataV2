// src/hooks/products/useProductsMonthlyDetails.ts
import { useMemo, useCallback } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { StandardFilters } from '@/hooks/common/types';

interface MonthlyDetailsRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly mois: string;
  readonly mois_libelle: string;
  readonly type_ligne: 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN';
  readonly quantite_vendue: number;
  readonly quantite_stock: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
}

interface MonthlyDetailsResponse {
  readonly monthlyData: MonthlyDetailsRow[];
  readonly count: number;
  readonly dateRange: { start: string; end: string };
  readonly queryTime: number;
  readonly cached: boolean;
}

interface UseProductsMonthlyDetailsOptions {
  readonly enabled?: boolean;
}

interface ProductSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly quantite_vendue_total: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly quantite_stock_moyenne: number;
  readonly quantite_stock_actuel: number;
}

interface UseProductsMonthlyDetailsReturn {
  readonly monthlyData: MonthlyDetailsRow[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isError: boolean;
  readonly queryTime: number;
  readonly cached: boolean;
  readonly count: number;
  readonly dateRange: { start: string; end: string } | null;
  readonly refetch: () => Promise<void>;
  readonly hasData: boolean;
  readonly productSummaries: ProductSummary[];
  readonly getMonthlyDetails: (codeEan: string) => MonthlyDetailsRow[];
}

// Fonction utilitaire pour convertir les strings en numbers
const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Fonction pour nettoyer les données API
const cleanMonthlyData = (rawData: any[]): MonthlyDetailsRow[] => {
  return rawData.map(row => ({
    nom: String(row.nom || ''),
    code_ean: String(row.code_ean || ''),
    mois: String(row.mois || ''),
    mois_libelle: String(row.mois_libelle || ''),
    type_ligne: row.type_ligne as 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN',
    quantite_vendue: parseNumericValue(row.quantite_vendue),
    quantite_stock: parseNumericValue(row.quantite_stock),
    prix_achat_moyen: parseNumericValue(row.prix_achat_moyen),
    prix_vente_moyen: parseNumericValue(row.prix_vente_moyen),
    taux_marge_moyen: parseNumericValue(row.taux_marge_moyen)
  }));
};

// Fonction pour calculer les 12 derniers mois
const getLast12MonthsDateRange = (): { start: string; end: string } => {
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  if (!startStr || !endStr) {
    throw new Error('Failed to generate date range');
  }
  
  return {
    start: startStr,
    end: endStr
  };
};

/**
 * Hook useProductsMonthlyDetails - VERSION SIMPLIFIÉE
 * 
 * ✅ Utilise directement products du store (contient logique ET/OU + exclusions)
 */
export function useProductsMonthlyDetails(
  options: UseProductsMonthlyDetailsOptions = {}
): UseProductsMonthlyDetailsReturn {
  
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // 🔥 Lecture directe de products (contient déjà logique ET/OU + exclusions)
  const products = useFiltersStore((state) => state.products);
  const excludedProducts = useFiltersStore((state) => state.excludedProducts);

  console.log('🎯 [useProductsMonthlyDetails] Using products from store:', {
    total: products.length,
    excluded: excludedProducts.length
  });

  // Calcul des 12 derniers mois
  const last12MonthsDateRange = useMemo(() => getLast12MonthsDateRange(), []);

  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: products,
  };

  // Ajout conditionnel des pharmacyIds
  if (pharmacyFilter.length > 0) {
    standardFilters.pharmacyIds = pharmacyFilter;
  }

  // Utilisation avec dateRange des 12 derniers mois
  const result = useStandardFetch<MonthlyDetailsResponse>('/api/products/monthly-details', {
    enabled: options.enabled,
    dateRange: last12MonthsDateRange,
    filters: standardFilters
  });

  // Nettoyage des données avec conversion string->number
  const cleanedMonthlyData = useMemo(() => {
    if (!result.data?.monthlyData) return [];
    return cleanMonthlyData(result.data.monthlyData);
  }, [result.data?.monthlyData]);

  // Calcul des synthèses produits
  const productSummaries = useMemo((): ProductSummary[] => {
    const summariesMap = new Map<string, ProductSummary>();
    
    cleanedMonthlyData.forEach((row) => {
      if (row.type_ligne === 'SYNTHESE' || row.type_ligne === 'STOCK_MOYEN') {
        const existing = summariesMap.get(row.code_ean);
        
        if (row.type_ligne === 'SYNTHESE') {
          summariesMap.set(row.code_ean, {
            nom: row.nom,
            code_ean: row.code_ean,
            quantite_vendue_total: row.quantite_vendue,
            prix_achat_moyen: row.prix_achat_moyen,
            prix_vente_moyen: row.prix_vente_moyen,
            taux_marge_moyen: row.taux_marge_moyen,
            quantite_stock_moyenne: existing?.quantite_stock_moyenne || 0,
            quantite_stock_actuel: row.quantite_stock
          });
        } else if (row.type_ligne === 'STOCK_MOYEN') {
          const synthese = existing || {
            nom: row.nom,
            code_ean: row.code_ean,
            quantite_vendue_total: 0,
            prix_achat_moyen: 0,
            prix_vente_moyen: 0,
            taux_marge_moyen: 0,
            quantite_stock_moyenne: 0,
            quantite_stock_actuel: 0
          };
          
          summariesMap.set(row.code_ean, {
            ...synthese,
            quantite_stock_moyenne: row.quantite_stock
          });
        }
      }
    });
    
    return Array.from(summariesMap.values());
  }, [cleanedMonthlyData]);

  // Fonction pour récupérer les détails mensuels d'un produit spécifique
  const getMonthlyDetails = useCallback((codeEan: string): MonthlyDetailsRow[] => {
    return cleanedMonthlyData.filter(
      row => row.code_ean === codeEan && row.type_ligne === 'MENSUEL'
    ).sort((a, b) => a.mois.localeCompare(b.mois));
  }, [cleanedMonthlyData]);

  return {
    monthlyData: cleanedMonthlyData,
    isLoading: result.isLoading,
    error: result.error,
    isError: result.isError,
    queryTime: result.data?.queryTime || 0,
    cached: result.data?.cached || false,
    count: result.data?.count || 0,
    dateRange: result.data?.dateRange || null,
    refetch: result.refetch,
    hasData: cleanedMonthlyData.length > 0,
    productSummaries,
    getMonthlyDetails
  };
}