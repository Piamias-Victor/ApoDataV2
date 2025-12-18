import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { AchatsKpiRequest } from '@/types/kpi';

export interface NetworkHealthData {
    dn_percent: number;
    active_count: number;
    total_count: number;
    active_pharmacies: { id: string; name: string }[];
    missing_pharmacy_names: string[];
    concentration_percent: number;
    pareto_pharmacies: { id: string; name: string }[];
}

export const useNetworkHealthKpi = (overrides?: Partial<AchatsKpiRequest>) => {
    const defaultRequest = useKpiRequest();

    const request = useMemo(() => ({
        ...defaultRequest,
        ...overrides
    }), [defaultRequest, overrides]);

    const query = useQuery({
        queryKey: ['network-health-kpi', request],
        queryFn: async () => {
            const res = await fetch('/api/kpi/network-health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch Network Health KPI');
            return res.json() as Promise<NetworkHealthData>;
        }
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error
    };
};
