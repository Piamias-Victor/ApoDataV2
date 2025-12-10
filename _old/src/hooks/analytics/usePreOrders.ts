import { useState, useCallback } from 'react';
import { PreOrdersResponse } from '@/types/pre-orders';

interface UsePreOrdersReturn {
    data: PreOrdersResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchPreOrders: (filters: {
        dateRange: { start: string; end: string };
        pharmacyIds?: string[];
        productCodes?: string[];
        categoryCodes?: string[];
        laboratoryCodes?: string[];
    }) => Promise<void>;
}

export function usePreOrders(): UsePreOrdersReturn {
    const [data, setData] = useState<PreOrdersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPreOrders = useCallback(async (filters: any) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/analytics/pre-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch pre-orders');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching pre-orders:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        data,
        isLoading,
        error,
        fetchPreOrders
    };
}
