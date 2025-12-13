import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const usePriceEvolutionKpi = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['price-evolution-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/price-evolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Price Evolution KPI');
            return res.json();
        }
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error
    };
};
