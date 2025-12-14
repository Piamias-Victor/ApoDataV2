import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { ProductAnalysisRow } from '@/types/kpi';
import { useState } from 'react';

export const useProductAnalysis = () => {
    const request = useKpiRequest();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const query = useQuery({
        queryKey: ['product-analysis', request, page, search],
        queryFn: async () => {
            const res = await fetch('/api/stats/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...request, page, search })
            });
            if (!res.ok) throw new Error('Failed to fetch product analysis');
            return res.json() as Promise<{ data: ProductAnalysisRow[], total: number }>;
        },
        // enabled: !!request.pharmacyIds?.length,
        // placeholderData: (previousData) => previousData // REMOVED to allow skeleton loading on filter change
    });

    return {
        ...query,
        page,
        setPage,
        search,
        setSearch
    };
};
