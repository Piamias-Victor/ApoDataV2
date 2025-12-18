import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { AchatsKpiRequest } from '@/types/kpi';

export const useVentesKpi = (overrides?: Partial<AchatsKpiRequest>) => {
    const defaultRequest = useKpiRequest();

    const request = useMemo(() => ({
        ...defaultRequest,
        ...overrides
    }), [defaultRequest, overrides]);

    const query = useQuery({
        queryKey: ['ventes-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/ventes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Ventes KPI');
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
