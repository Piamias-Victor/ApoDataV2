import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { ProductAnalysisRow, AchatsKpiRequest } from '@/types/kpi';
import { useState } from 'react';

export const useProductAnalysis = (options: { itemsPerPage?: number, overrides?: Partial<AchatsKpiRequest> } = {}) => {
    const { itemsPerPage = 10, overrides } = options;
    const defaultRequest = useKpiRequest();
    
    // Merge overrides
    const request = { ...defaultRequest, ...overrides };

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
        queryKey: ['product-analysis', request, page, search, sortBy, sortOrder, itemsPerPage],
        queryFn: async () => {
            const res = await fetch('/api/stats/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...request, page, limit: itemsPerPage, search, sortBy, sortOrder })
            });
            if (!res.ok) throw new Error('Failed to fetch product analysis');
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
