import { useState, useMemo } from 'react';

type SortOrder = 'asc' | 'desc';

interface UseClientTableSortProps<T> {
    data: T[];
    initialSortBy?: string;
    initialSortOrder?: SortOrder;
}

export const useClientTableSort = <T>({ data, initialSortBy = '', initialSortOrder = 'desc' }: UseClientTableSortProps<T>) => {
    const [sortBy, setSortBy] = useState<string>(initialSortBy);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const sortedData = useMemo(() => {
        if (!sortBy) return data;

        return [...data].sort((a: any, b: any) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (aValue === bValue) return 0;

            // Handle null/undefined
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            const comparison = aValue < bValue ? -1 : 1;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [data, sortBy, sortOrder]);

    return {
        sortBy,
        sortOrder,
        handleSort,
        sortedData
    };
};
