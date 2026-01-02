import { useQuery } from '@tanstack/react-query';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useFilterStore } from '@/stores/useFilterStore';

export interface ComparisonStats {
    sales_ht: number;
    sales_ht_evolution: number | null;
    margin_eur: number;
    margin_eur_evolution: number | null;
    margin_rate: number;
    margin_rate_evolution: number | null;
    qty_sold: number;
    qty_sold_evolution: number | null;
    qty_bought: number;
    qty_bought_evolution: number | null;
    purchases_ht: number;
    purchases_ht_evolution: number | null;
    stock_value: number;
    stock_quantity: number;
    days_stock: number;
    nb_refs: number;
}

interface ComparisonResult {
    entityId: string;
    stats: ComparisonStats;
}

async function fetchComparisonStats(entities: any[], dateRange: { from: string, to: string }, pharmacyId?: string) {
    if (entities.length === 0) return [];

    const response = await fetch('/api/comparison/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entities, dateRange, pharmacyId })
    });

    if (!response.ok) throw new Error('Failed to fetch comparison stats');
    const data = await response.json();
    return data.results as ComparisonResult[];
}

export const useComparisonData = () => {
    const { entities } = useComparisonStore();
    const { dateRange, pharmacies } = useFilterStore();

    // Use the first selected pharmacy ID if available, otherwise undefined (might rely on session)
    const pharmacyId = pharmacies.length > 0 ? pharmacies[0]?.id : undefined;

    return useQuery({
        queryKey: ['comparison-stats', entities, dateRange, pharmacyId],
        queryFn: () => fetchComparisonStats(entities, {
            from: dateRange.start || '',
            to: dateRange.end || ''
        }, pharmacyId),
        enabled: entities.length > 0 && !!dateRange.start && !!dateRange.end,
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });
};
