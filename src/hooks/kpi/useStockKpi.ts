import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const useStockKpi = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['stock-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Stock KPI');
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
