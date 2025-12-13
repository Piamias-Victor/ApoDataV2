import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const useAchatsKpi = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['achats-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/achats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Achats KPI');
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
