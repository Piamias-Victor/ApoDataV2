import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { TreeMapNode } from '@/components/organisms/CategoryAnalysis/components/TreeMapNode'; // Verify export

// Note: TreeMapNode interface is exported from this file in original code.
// If I moved TreeMapNode component, I should ensure I don't break types.
// The new component TreeMapNode imports TreeMapNode type from '../types'.
// I need to make sure types are consistent.
// In my refactor of TreeMapNode.tsx: `import { TreeMapNodeData } from '../types';`
// I haven't created `../types`.
// I should define the interface here or in types.
// Let's keep the interface here for now to avoid breaking existing code, OR better: move interface to separate file.

export interface TreeMapNode {
    name: string;
    value: number;
    count: number;
    percentage?: number;
    rank?: number;
}

export const useCategoryTree = (path: string[], showOthers: boolean = false) => {
    const request = useKpiRequest();


    const query = useQuery({
        queryKey: ['category-tree', request, path],
        queryFn: async ({ signal }) => {
            const res = await fetch('/api/stats/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request, path }),
                signal
            });
            if (!res.ok) throw new Error('Failed to fetch category data');
            return res.json() as Promise<TreeMapNode[]>;
        },
        placeholderData: (prev) => prev // Keep previous data while drilling to avoid flicker? Or maybe loading state is better? Loading state is better for drill down.
    });

    // Process Data
    const processedData = useMemo(() => {
        if (!query.data) return [];

        const sorted = [...query.data].sort((a, b) => b.value - a.value);
        const total = sorted.reduce((sum, item) => sum + item.value, 0);
        const TOP_N = 10;

        // If simple list or less than Limit
        if (sorted.length <= TOP_N) {
            return sorted.map((item, idx) => ({
                ...item,
                value: Math.round(item.value),
                rank: idx + 1,
                percentage: (item.value / total) * 100
            }));
        }

        // Logic split
        if (showOthers) {
            // SHOW TAIL (Index 10+)
            const tail = sorted.slice(TOP_N);
            return tail.map((item, idx) => ({
                ...item,
                value: Math.round(item.value),
                rank: TOP_N + 1 + idx,
                percentage: (item.value / total) * 100
            }));
        } else {
            // SHOW TOP 10 + Aggregate
            const top = sorted.slice(0, TOP_N);
            const others = sorted.slice(TOP_N);

            const othersValue = others.reduce((sum, item) => sum + item.value, 0);
            const othersCount = others.reduce((sum, item) => sum + item.count, 0);

            const result = top.map((item, idx) => ({
                ...item,
                value: Math.round(item.value),
                rank: idx + 1,
                percentage: (item.value / total) * 100
            }));

            result.push({
                name: `Autres (${others.length})`,
                value: Math.round(othersValue),
                count: othersCount,
                rank: TOP_N + 1,
                percentage: (othersValue / total) * 100
            });

            return result;
        }
    }, [query.data, showOthers]);

    return {
        data: processedData,
        rawCount: query.data?.length || 0,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError
    };
};

