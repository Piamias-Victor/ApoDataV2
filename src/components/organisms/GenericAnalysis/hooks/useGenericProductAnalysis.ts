import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { ProductAnalysisRow } from '@/types/kpi';
import { useState } from 'react';

export const useGenericProductAnalysis = (itemsPerPage: number = 20) => {
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
        queryKey: ['generic-product-analysis', request, page, search, sortBy, sortOrder],
        queryFn: async () => {
            const res = await fetch('/api/stats/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...request,
                    page,
                    limit: itemsPerPage,
                    search,
                    sortBy,
                    sortOrder,
                    isGenericAnalysis: true  // KEY DIFFERENCE from useProductAnalysis
                })
            });
            if (!res.ok) throw new Error('Failed to fetch generic product analysis');
            return res.json() as Promise<{ data: ProductAnalysisRow[], total: number }>;
        },
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
