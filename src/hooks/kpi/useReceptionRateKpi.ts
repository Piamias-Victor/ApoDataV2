import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const useReceptionRateKpi = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['reception-rate-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/reception-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Reception Rate KPI');
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
