import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { AchatsKpiRequest } from '@/types/kpi';

export const useAchatsKpi = (overrides?: Partial<AchatsKpiRequest>, options?: { enabled?: boolean }) => {
    const defaultRequest = useKpiRequest();

    // Merge overrides with default request
    const request = useMemo(() => ({
        ...defaultRequest,
        ...overrides,
        // If queryKey depends on request, ensure referential stability or deep equality if possible, 
        // but simple spread is usually fine if overrides is stable. 
        // Note: useKpiRequest returns a stable object if its inputs are stable.
    }), [defaultRequest, overrides]);

    const query = useQuery({
        queryKey: ['achats-kpi', request],
        enabled: options?.enabled !== false, // Default true
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
