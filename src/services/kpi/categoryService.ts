import { AchatsKpiRequest } from '@/types/kpi';
import { getCategoryMetrics, CategoryMetric } from '@/repositories/kpi/categoryRepository';
import { queryCache, withCache } from '@/lib/cache/queryCache';

export async function getCategoryTreeData(request: AchatsKpiRequest, path: string[]): Promise<CategoryMetric[]> {
    // Generate minimal cache key
    // We include path in the key
    const cacheKey = queryCache.generateKey('category-treemap', { ...request, path });

    return withCache(cacheKey, async () => {
        const data = await getCategoryMetrics(request, path);
        return data;
    });
}
