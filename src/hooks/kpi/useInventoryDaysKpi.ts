import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';

export const useInventoryDaysKpi = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['inventory-days-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/inventory-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Inventory Days KPI');
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
