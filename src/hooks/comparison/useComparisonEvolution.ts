import { useQuery } from '@tanstack/react-query';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { useFilterStore } from '@/stores/useFilterStore';

export interface ComparisonEvolutionPoint {
    date: string;
    sales_ht: number;
    margin_eur: number;
    qty_sold: number;
}

interface ComparisonEvolutionResult {
    entityId: string;
    evolution: ComparisonEvolutionPoint[];
}

async function fetchComparisonEvolution(entities: any[], dateRange: { from: string, to: string }, pharmacyId?: string) {
    if (entities.length === 0) return [];

    const response = await fetch('/api/comparison/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entities, dateRange, pharmacyId })
    });

    if (!response.ok) throw new Error('Failed to fetch comparison evolution');
    const data = await response.json();
    return data.results as ComparisonEvolutionResult[];
}

export const useComparisonEvolution = () => {
    const { entities } = useComparisonStore();
    const { dateRange, pharmacies } = useFilterStore();

    const pharmacyId = pharmacies.length > 0 ? pharmacies[0]?.id : undefined;

    return useQuery({
        queryKey: ['comparison-evolution', entities, dateRange, pharmacyId],
        queryFn: () => fetchComparisonEvolution(entities, {
            from: dateRange.start || '',
            to: dateRange.end || ''
        }, pharmacyId),
        enabled: entities.length > 0 && !!dateRange.start && !!dateRange.end,
        staleTime: 5 * 60 * 1000
    });
};
