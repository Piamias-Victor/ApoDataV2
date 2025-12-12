import { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFilterStore } from '@/stores/useFilterStore';
import { useQuery } from '@tanstack/react-query';
import { AchatsKpiRequest, Grain } from '@/types/kpi';

export type DataType = 'value' | 'cumulative';

export interface EvolutionDataPoint {
    date: string; // Display formatted date
    achat_ht: number;
    vente_ttc: number;
    stock_qte: number;
    marge_eur: number;
    // Cumulative
    achat_ht_cumul?: number;
    vente_ttc_cumul?: number;
    marge_eur_cumul?: number;
}

// Raw API response shape
interface ApiDataPoint {
    date: string; // ISO
    achat_ht: number;
    vente_ttc: number;
    marge_eur: number;
    stock_qte: number;
}

export const useEvolutionData = (grain: Grain) => {
    // We keep the name useMockEvolutionData for now to avoid refactoring imports everywhere, 
    // but internally it fetches real data. Can be renamed later.

    const store = useFilterStore();

    // Construct Request similar to useAchatsKpi
    const request: AchatsKpiRequest & { grain: Grain } = useMemo(() => ({
        dateRange: {
            start: store.dateRange.start || '',
            end: store.dateRange.end || ''
        },
        productCodes: store.products.map(p => p.code),
        laboratories: store.laboratories.map(l => l.name),
        categories: store.categories.map(c => ({ code: c.name, type: c.type })),
        pharmacyIds: store.pharmacies.map(p => p.id),
        // Exclusions
        excludedPharmacyIds: store.excludedPharmacies.map(p => p.id),
        excludedLaboratories: store.excludedLaboratories.map(l => l.name),
        excludedCategories: store.excludedCategories.map(c => ({ code: c.name, type: c.type })),
        excludedProductCodes: store.excludedProducts.map(p => p.code),
        // Settings
        filterOperators: store.filterOperators,
        reimbursementStatus: store.settings.reimbursementStatus,
        isGeneric: store.settings.isGeneric,
        tvaRates: store.settings.tvaRates,
        ...(store.settings.purchasePriceNetRange && { purchasePriceNetRange: store.settings.purchasePriceNetRange }),
        ...(store.settings.purchasePriceGrossRange && { purchasePriceGrossRange: store.settings.purchasePriceGrossRange }),
        ...(store.settings.sellPriceRange && { sellPriceRange: store.settings.sellPriceRange }),
        ...(store.settings.discountRange && { discountRange: store.settings.discountRange }),
        ...(store.settings.marginRange && { marginRange: store.settings.marginRange }),
        grain: grain
    }), [store, grain]);

    const query = useQuery({
        queryKey: ['temporal-evolution', request],
        queryFn: async ({ signal }) => {
            const res = await fetch('/api/stats/temporal-evolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
                signal
            });
            if (!res.ok) throw new Error('Failed to fetch evolution data');
            return res.json() as Promise<ApiDataPoint[]>;
        },
        select: (data) => {
            let accAchat = 0;
            let accVente = 0;
            let accMarge = 0;

            return data.map(point => {
                accAchat += point.achat_ht;
                accVente += point.vente_ttc;
                accMarge += point.marge_eur;

                const dateObj = parseISO(point.date);
                const displayDate = isValid(dateObj)
                    ? format(dateObj, grain === 'month' ? 'MMM yyyy' : (grain === 'week' ? "'S'ww" : 'dd MMM'), { locale: fr })
                    : point.date;

                return {
                    date: displayDate,
                    achat_ht: point.achat_ht,
                    vente_ttc: point.vente_ttc,
                    stock_qte: point.stock_qte,
                    marge_eur: point.marge_eur,
                    achat_ht_cumul: accAchat,
                    vente_ttc_cumul: accVente,
                    marge_eur_cumul: accMarge
                } as EvolutionDataPoint;
            });
        }
    });

    return {
        data: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError
    };
};
