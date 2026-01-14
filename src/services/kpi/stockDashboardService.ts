import { AchatsKpiRequest, StockReceptionKpiResponse, StockCurrentKpiResponse, StockInventoryKpiResponse, StockDiscrepancyKpiResponse } from '@/types/kpi';

import { fetchPreorderEvolution } from '@/repositories/kpi/achatsRepository';
import { fetchStockData, fetchAvgStock12Months, getStockSnapshots, fetchRestockingData } from '@/repositories/kpi/stockRepository';
import { fetchInventoryDays } from '@/repositories/kpi/inventoryDaysRepository';
import { fetchDiscrepancyData } from '@/repositories/kpi/ruptureRepository';
import * as ventesRepository from '@/repositories/kpi/ventesRepository';
import * as achatsRepository from '@/repositories/kpi/achatsRepository';
import { format, subMonths, addDays, addMonths, subDays } from 'date-fns';

/**
 * 1. Reception KPI (Card 1 & 2)
 */
export async function getStockReceptionKpi(request: AchatsKpiRequest): Promise<StockReceptionKpiResponse> {
    // Qty Ordered & Amount Ordered
    // fetchPreorderEvolution gives daily breakdown of 'ordered' AND 'received' (based on sent_date).
    const orderedStats = await fetchPreorderEvolution(request, 'day');

    // Sum totals based on actual database values (no estimation)
    const totalOrderedQty = orderedStats.reduce((acc, curr) => acc + curr.achat_qty, 0);
    const totalReceivedQty = orderedStats.reduce((acc, curr) => acc + curr.achat_rec_qty, 0);
    const totalOrderedAmount = orderedStats.reduce((acc, curr) => acc + curr.achat_ht, 0);
    const totalReceivedAmount = orderedStats.reduce((acc, curr) => acc + curr.achat_rec_ht, 0);

    // Calculate Rate
    const rate = totalOrderedQty > 0 ? (totalReceivedQty / totalOrderedQty) * 100 : 0;

    return {
        qte_commandee: Math.round(totalOrderedQty),
        qte_receptionnee: Math.round(totalReceivedQty),
        taux_reception: rate,
        montant_commande_ht: totalOrderedAmount,
        montant_receptionne_ht: totalReceivedAmount
    };
}

/**
 * 2. Current Stock KPI (Card 3)
 */
export async function getStockCurrentKpi(request: AchatsKpiRequest): Promise<StockCurrentKpiResponse> {
    const targetDate = request.dateRange.end;
    const data = await fetchStockData(request, targetDate);

    return {
        stock_qte: data.stock_quantity,
        stock_value_ht: data.stock_value_ht,
        nb_references: data.nb_references
    };
}

/**
 * 3. Inventory KPI (Card 4)
 */
export async function getInventoryKpi(request: AchatsKpiRequest): Promise<StockInventoryKpiResponse> {
    const targetDate = request.dateRange.end;

    const days = await fetchInventoryDays(request, targetDate);
    const avg12 = await fetchAvgStock12Months(request, targetDate);

    return {
        days_of_stock: days,
        avg_stock_value_12m: avg12
    };
}

/**
 * 4. Discrepancy KPI (Card 5)
 */
export async function getDiscrepancyKpi(request: AchatsKpiRequest): Promise<StockDiscrepancyKpiResponse> {
    const data = await fetchDiscrepancyData(request);
    const pct = data.total_refs_ordered === 0 ? 0 : (data.nb_discrepancy / data.total_refs_ordered) * 100;

    return {
        nb_references_with_discrepancy: data.nb_discrepancy,
        percent_references_with_discrepancy: pct,
        discrepancy_product_codes: data.discrepancy_codes,
        avg_reception_rate_of_discrepancies: data.avg_discrepancy_rate
    };
}

/**
 * 5. Stock Evolution & Forecast
 * History: Monthly (Last 12 Months)
 * Forecast: Monthly (Next 3 Months)
 */
export async function getStockEvolution(originalRequest: AchatsKpiRequest) {
    // 1. Define Ranges
    const today = new Date();
    const historyStart = subMonths(today, 12);
    const historyEnd = today;

    const forecastStart = addDays(today, 1);
    const forecastEnd = addMonths(today, 3);

    // Velocity: Last 90 days
    const velocityStart = subDays(today, 90);
    const velocityEnd = today;

    // 2. Prepare Base Request (strip original date range)
    const baseRequest = { ...originalRequest };

    // 3. Parallel Data Fetching
    const [
        stockHistory,
        salesHistory,
        receptionHistory,
        velocityData,
        receptionVelocityAvg // Renamed to avoid local var conflict
    ] = await Promise.all([
        // A. Historical Charts
        getStockSnapshots({
            ...baseRequest,
            dateRange: { start: historyStart.toISOString(), end: historyEnd.toISOString() }
        }),
        ventesRepository.getSalesQuantityEvolution({
            ...baseRequest,
            dateRange: { start: historyStart.toISOString(), end: historyEnd.toISOString() }
        }, 'month'),
        achatsRepository.getReceptionQuantityEvolution({
            ...baseRequest,
            dateRange: { start: historyStart.toISOString(), end: historyEnd.toISOString() }
        }, 'month'),

        // B. Sales Velocity (Last 90 days)
        ventesRepository.fetchVentesData({
            ...baseRequest,
            dateRange: { start: velocityStart.toISOString(), end: velocityEnd.toISOString() }
        }),

        // C. Reception Velocity (Last 90 days average)
        achatsRepository.fetchReceptionVelocity(baseRequest, 90),
    ]);

    // --- Process Results ---

    // 2. Prepare Maps for Daily/Monthly Aggregation
    const dataMap = new Map<string, any>();

    const getMonthKey = (date: Date) => format(date, 'yyyy-MM');
    const getOrInit = (key: string, dateObj: Date) => {
        if (!dataMap.has(key)) {
            dataMap.set(key, {
                date: key,
                stock_real: null,
                stock_forecast: null,
                sales_real: 0,
                sales_forecast: 0,
                reception_real: 0,
                reception_forecast: 0,
                rawDate: dateObj
            });
        }
        return dataMap.get(key)!;
    };

    // --- Populate History ---
    // --- Populate History ---
    // stockHistory now contains a FULL timeline (monthly spine) with gaps filled
    // so we trust it to initialize the keys properly.
    stockHistory.forEach(item => {
        const d = new Date(item.date);
        const k = getMonthKey(d);
        const obj = getOrInit(k, d);
        // FORCE 'stock_real' value from SQL because SQL handles the gap filling now
        obj.stock_real = item.stock_qte; 
    });
    salesHistory.forEach(item => {
        const d = new Date(item.date);
        const k = getMonthKey(d);
        const obj = getOrInit(k, d);
        obj.sales_real = item.quantite_vendue;
    });
    receptionHistory.forEach(item => {
        const d = new Date(item.date);
        const k = getMonthKey(d);
        const obj = getOrInit(k, d);
        obj.reception_real = item.qte_receptionnee;
    });

    // --- Populate Forecast (Simulation) ---
    // Start from the LAST historical point to ensure continuity
    let runningStock = 0;
    if (stockHistory.length > 0) {
        const sortedHistory = [...stockHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        runningStock = sortedHistory[sortedHistory.length - 1]?.stock_qte || 0;
    }

    // 4. Calculate Velocity (Units / Day)
    const totalSales90d = velocityData.quantite_vendue || 0;
    const salesVelocity = totalSales90d / 90;
    const receptionVelocity = receptionVelocityAvg || 0;

    // Daily Simulation
    let currentDay = new Date(forecastStart);
    const end = new Date(forecastEnd);

    while (currentDay <= end) {
        const key = getMonthKey(currentDay);
        const obj = getOrInit(key, currentDay);

        const dailySales = salesVelocity;
        const dailyReception = receptionVelocity;

        runningStock = runningStock - dailySales + dailyReception;

        obj.sales_forecast += dailySales;
        obj.reception_forecast += dailyReception;
        obj.stock_forecast = Math.round(runningStock);

        currentDay = addDays(currentDay, 1);
    }

    // Sort and Format
    const finalData = Array.from(dataMap.values())
        .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
        .map(({ rawDate, ...rest }) => ({
            ...rest,
            sales_forecast: rest.sales_forecast ? Math.round(rest.sales_forecast) : null,
            reception_forecast: rest.reception_forecast ? Math.round(rest.reception_forecast) : null
        }));

    return finalData;
}

/**
 * 6. Restocking Table Data
 */
export async function getRestockingData(request: AchatsKpiRequest) {
    return fetchRestockingData(request);
}

/**
 * 7. Laboratory Discrepancy Data
 */
import { fetchLaboratoryDiscrepancyData } from '@/repositories/kpi/laboratoryDiscrepancyRepository';


export async function getLaboratoryDiscrepancy(request: AchatsKpiRequest) {
    return fetchLaboratoryDiscrepancyData(request);
}

/**
 * 8. Product Discrepancy Data
 */
import { fetchProductDiscrepancyData } from '@/repositories/kpi/productDiscrepancyRepository';

export async function getProductDiscrepancy(request: AchatsKpiRequest) {
    return fetchProductDiscrepancyData(request);
}
