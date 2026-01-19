import { useQuery } from '@tanstack/react-query';

import { useFilterStore } from '@/stores/useFilterStore';

export interface RegionParams {
    region: string;
    value: number;
    pharmacyCount: number;
    averageSales: number;
    comparison?: {
        nationalAverage: number;
        deviation: number;
        label: string;
    };
}

export const useRegionSales = () => {
    const filters = useFilterStore();

    return useQuery({
        queryKey: ['region-sales', filters],
        queryFn: async () => {
            const response = await fetch('/api/stats/regions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        },
        // Cache for 5 minutes
        staleTime: 1000 * 60 * 5,
    });
};
