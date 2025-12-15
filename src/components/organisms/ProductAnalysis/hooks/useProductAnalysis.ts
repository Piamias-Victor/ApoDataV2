import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { ProductAnalysisRow } from '@/types/kpi';
import { useState } from 'react';

export const useProductAnalysis = () => {
    const request = useKpiRequest();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<string>('my_sales_qty');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const query = useQuery({
        queryKey: ['product-analysis', request, page, search, sortBy, sortOrder],
        queryFn: async () => {
            const res = await fetch('/api/stats/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...request, page, search, sortBy, sortOrder })
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
        setSearch,
        sortBy,
        sortOrder,
        handleSort
    };
};
