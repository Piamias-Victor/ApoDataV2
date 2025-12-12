import { AchatsKpiRequest, Grain } from '@/types/kpi';
import { getSalesEvolutionMetrics } from '@/repositories/kpi/ventesRepository';
import { getPurchasesEvolution } from '@/repositories/kpi/achatsRepository';
import { getStockSnapshots } from '@/repositories/kpi/stockRepository';
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { queryCache, withCache } from '@/lib/cache/queryCache';

interface EvolutionDataPoint {
    date: string;
    achat_ht: number;
    vente_ttc: number;
    marge_eur: number;
    stock_qte: number;
}

export async function getTemporalEvolutionData(request: AchatsKpiRequest, grain: Grain): Promise<EvolutionDataPoint[]> {
    const cacheKey = queryCache.generateKey('temporal-evolution', { ...request, grain });

    return withCache(cacheKey, async () => {
        const { dateRange } = request;
        if (!dateRange.start || !dateRange.end) return [];

        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        // 1. Parallel Fetch
        const [salesData, purchasesData, stockSnapshots] = await Promise.all([
            getSalesEvolutionMetrics(request, grain),
            getPurchasesEvolution(request, grain),
            getStockSnapshots(request)
        ]);

        // 2. Generate Time Buckets
        let buckets: Date[] = [];
        try {
            if (grain === 'day') {
                buckets = eachDayOfInterval({ start: startDate, end: endDate });
            } else if (grain === 'week') {
                buckets = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
            } else {
                buckets = eachMonthOfInterval({ start: startDate, end: endDate });
            }
        } catch (e) {
            console.error("Invalid interval for bucket generation", e);
            return [];
        }

        // 3. Merge & Interpolate
        return buckets.map(bucketDate => {
            // Matchers
            const isSame = grain === 'day' ? isSameDay : (grain === 'week' ? isSameWeek : isSameMonth);

            // Sales
            const sales = salesData.find(d => isSame(new Date(d.date), bucketDate));

            // Purchases
            const purchase = purchasesData.find(d => isSame(new Date(d.date), bucketDate));

            // Stock (Interpolation)
            // Logic: Find the latest snapshot that is ON or BEFORE the bucketDate.
            const validSnapshots = stockSnapshots.filter(s => {
                const sDate = new Date(s.date);
                return sDate.getTime() <= bucketDate.getTime();
            });

            // Take the last one
            const currentStock = validSnapshots.length > 0 ? validSnapshots[validSnapshots.length - 1]?.stock_qte || 0 : 0;

            return {
                date: bucketDate.toISOString(),
                achat_ht: purchase?.achat_ht || 0,
                vente_ttc: sales?.vente_ttc || 0,
                marge_eur: sales?.marge_eur || 0,
                stock_qte: currentStock
            };
        });
    });
}
