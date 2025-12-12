import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';
import { fetchStockData } from './stockRepository';
import { subMonths, format } from 'date-fns';

/**
 * Calculate Inventory Days (Rolling 12 Months).
 * Formula: Current Stock Qty / (Sold Qty Last 12 Months / 365)
 */
export async function fetchInventoryDays(request: AchatsKpiRequest, targetDate: string): Promise<number> {
    const { laboratories = [], categories = [], pharmacyIds = [], filterOperators = [] } = request;

    // 1. Get Current Stock at targetDate
    const stockData = await fetchStockData(request, targetDate);
    const stockQty = stockData.stock_quantity;

    if (stockQty === 0) return 0;

    // 2. Get Sales for the 12 months PRIOR to targetDate
    // Range: [targetDate - 12 months, targetDate]
    const dateEnd = targetDate;
    const dateStart = format(subMonths(new Date(targetDate), 12), 'yyyy-MM-dd');

    const qb = new FilterQueryBuilder([dateStart, dateEnd], 3, filterOperators, {
        pharmacyId: 'mv.pharmacy_id',
        laboratory: 'mv.laboratory_name',
        productCode: 'mv.code_13_ref',
        tva: 'mv.tva_rate',
        reimbursable: 'mv.is_reimbursable',
        genericStatus: 'mv.bcb_generic_status',
        cat_l1: 'mv.category_name',
    });

    qb.addPharmacies(pharmacyIds);
    qb.addLaboratories(laboratories);
    qb.addCategories(categories);
    if (request.productCodes) qb.addProducts(request.productCodes);
    qb.addReimbursementStatus(request.reimbursementStatus);
    qb.addGenericStatus(request.isGeneric);

    const dynamicWhereClause = qb.getConditions();
    const params = qb.getParams();

    const query = `
        SELECT COALESCE(SUM(mv.quantity), 0) as total_sold_12m
        FROM mv_sales_enriched mv
        WHERE mv.sale_date >= $1::date AND mv.sale_date <= $2::date
        ${dynamicWhereClause}
    `;

    const startTime = Date.now();

    try {
        const result = await db.query(query, params);
        const sold12m = Number(result.rows[0]?.total_sold_12m) || 0;

        // Avoid division by zero
        if (sold12m === 0) return 0;

        const dailySales = sold12m / 365;
        const days = Math.round(stockQty / dailySales);

        console.log(`📦 [Repository] Inventory Days: Stock=${stockQty}, Sold12M=${sold12m}, Days=${days} (${Date.now() - startTime}ms)`);

        return days;

    } catch (error) {
        console.error('❌ [Repository] Inventory Days query failed:', error);
        throw error;
    }
}
