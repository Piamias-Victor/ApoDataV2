import { useState, useCallback } from 'react';
import { MonthlyMetricsResponse } from '@/types/monthly-metrics';

interface UseMonthlyMetricsReturn {
    data: MonthlyMetricsResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchMonthlyMetrics: (filters: {
        dateRange: { start: string; end: string };
        pharmacyIds?: any[];
        productCodes?: string[];
        categoryCodes?: string[];
        laboratoryCodes?: string[];
    }) => Promise<void>;
}

export function useMonthlyMetrics(): UseMonthlyMetricsReturn {
    const [data, setData] = useState<MonthlyMetricsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMonthlyMetrics = useCallback(async (filters: any) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/pharmacies/monthly-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch monthly metrics');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching monthly metrics:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        data,
        isLoading,
        error,
        fetchMonthlyMetrics
    };
}
