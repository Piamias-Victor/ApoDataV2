import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const useMargeKpi = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['marge-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/marge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Marge KPI');
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
