
import { db } from '@/lib/db';
import { AchatsKpiRequest, ProductAnalysisRow } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';
import { ProductQueries } from '@/queries/kpi/ProductQueries';

export class ProductAnalysisRepository extends BaseKpiRepository {

    async execute(request: AchatsKpiRequest, page = 1, pageSize = 20, search = '', sortBy = 'my_sales_qty', sortOrder: 'asc' | 'desc' = 'desc', genericStatusFilter?: string, productTypeFilter?: string): Promise<{ data: ProductAnalysisRow[], total: number }> {
        const context = KpiRequestMapper.toContext(request, page, pageSize);
        const myPharmacyId = request.pharmacyIds?.[0] || null;

        // 1. Prepare Base Params
        const { current, previous } = context.periods;
        const baseParams = [current.start, current.end, previous.start, previous.end, myPharmacyId];

        // 2. Operators Tuning (Manual pharmacy handling in SQL)
        const operators = (myPharmacyId) ? (request.filterOperators || []).slice(1) : request.filterOperators;

        // 3. Build Query
        const qb = this.createBuilder(context, baseParams, {
            pharmacyId: 'mv.pharmacy_id',
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.ean13'
        }, operators);

        // 4. Handle Search (Specific to this repo)
        let searchCondition = '';
        const params = qb.getParams();

        if (search) {
            const idx = params.length + 1;
            searchCondition = `AND (mv.product_label ILIKE $${idx} OR mv.ean13 ILIKE $${idx} OR mv.laboratory_name ILIKE $${idx})`;
            params.push(`%${search}%`);
        }

        // 5. Build Sort Clauses
        // Map frontend sort keys to DB Columns.
        // CTE Columns: 'sales_qty', 'sales_ttc', 'product_name' (Global/My matches for simple ones)
        // Final Columns: 'gs.sales_qty', 'gs.sales_ttc' OR 'ms.my_sales_qty' etc.

        const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
        const nulls = sortOrder === 'asc' ? 'NULLS FIRST' : 'NULLS LAST';

        // Column mappings
        // If sorting by 'my_sales_qty' -> CTE: 'sales_qty' (Global), 'my_sales_qty' (Comparative). Final: 'gs.sales_qty' (Global), 'ms.my_sales_qty' (Comp).
        // Actually, for Global Query, CTE stats are 'sales_qty', 'sales_ttc' etc.
        // For Comparative, CTE stats are 'my_sales_qty', 'my_sales_ttc'.

        let cteSortColumn = 'sales_qty'; // Default
        let finalSortColumn = 'sales_qty';

        // Columns that are calculated in the outer query and do NOT exist in the CTEs
        // Therefore, they must NOT be prefixed with 'ms.' or 'gs.'
        const calculatedColumns = [
            'avg_purchase_price', 'avg_sell_price', 
            'my_margin_rate', 'group_avg_margin_rate',
            'my_days_of_stock',
            'my_stock_qty', 'my_stock_value_ht', // Added stock cols here
            'my_pdm_pct', 'group_pdm_pct',
            'my_pdm_purchases_pct',
            'my_sales_evolution', 'group_sales_evolution',
            'my_purchases_evolution', 'group_purchases_evolution',
            'my_sales_qty_evolution', 'group_sales_qty_evolution',
            'my_purchases_qty_evolution', 'group_purchases_qty_evolution',
            'my_margin_rate_evolution', 'group_margin_rate_evolution',
            'my_pdm_evolution', 'group_pdm_evolution',
            'my_pdm_purchases_evolution',
            'my_margin_ht_evolution',
            'my_stock_qty_evolution',
            'my_stock_value_ht_evolution'
        ];

        // normalize aliases
        if (sortBy === 'stock_qty') sortBy = 'my_stock_qty';
        if (sortBy === 'stock_value_ht') sortBy = 'my_stock_value_ht';

        if (myPharmacyId) {
            // Comparative
            if (sortBy === 'product_name') {
                cteSortColumn = 'product_name';
                finalSortColumn = 'ms.product_name';
            } else if (sortBy === 'laboratory_name') {
                cteSortColumn = 'laboratory_name';
                finalSortColumn = 'ms.laboratory_name';
            } else if (calculatedColumns.includes(sortBy)) {
                // Calculated columns in outer query, no prefix needed in final sort
                cteSortColumn = 'my_sales_qty'; // Fallback for CTE sort (optimization)
                finalSortColumn = sortBy;
            } else {
                cteSortColumn = sortBy;
                finalSortColumn = `ms.${cteSortColumn}`;
            }
        } else {
            // Global
            if (sortBy === 'product_name') {
                cteSortColumn = 'product_name';
                finalSortColumn = 'gs.product_name';
            }
            else if (sortBy === 'laboratory_name') {
                cteSortColumn = 'laboratory_name';
                finalSortColumn = 'gs.laboratory_name';
            }
            else if (calculatedColumns.includes(sortBy)) {
                // Calculated columns in outer query
                cteSortColumn = 'sales_qty';
                finalSortColumn = sortBy;
            }
            else {
                // Remove 'my_' prefix for Global CTE columns (sales_qty vs my_sales_qty)
                const baseCol = sortBy.replace(/^my_/, '');
                cteSortColumn = baseCol;
                finalSortColumn = `gs.${baseCol}`;
            }
        }

        // Prevent SQL Injection by whitelisting (basic check or rely on query strictness, but here we construct string)
        // Simple regex validation
        if (!/^[a-zA-Z0-9_.]+$/.test(cteSortColumn)) cteSortColumn = 'sales_qty';
        if (!/^[a-zA-Z0-9_.]+$/.test(finalSortColumn)) finalSortColumn = 'gs.sales_qty';

        const orderByClause = `ORDER BY ${cteSortColumn} ${direction} ${nulls}`;
        const finalOrderByClause = `ORDER BY ${finalSortColumn} ${direction} ${nulls}`;


        // 6. Finalize SQL Parts
        const isFiltered = search || qb.getConditions().length > 0;
        // If we are custom sorting, disable the optimization LIMIT in CTE to ensure we sort the WHOLE set before picking top N.
        const defaultSort = sortBy === 'my_sales_qty' && sortOrder === 'desc';
        const limitClause = (isFiltered || !defaultSort) ? '' : 'LIMIT 1000';

        const limitIdx = params.length + 1;
        const offsetIdx = params.length + 2;
        params.push(pageSize, context.pagination!.offset);

        // 7. Select Strategy & SQL
        const querySql = (!myPharmacyId)
            ? ProductQueries.getGlobalQuery(qb.getConditions(), searchCondition, limitClause, limitIdx, offsetIdx, orderByClause, finalOrderByClause, genericStatusFilter, productTypeFilter)
            : ProductQueries.getComparativeQuery(qb.getConditions(), searchCondition, limitClause, limitIdx, offsetIdx, orderByClause, finalOrderByClause, genericStatusFilter, productTypeFilter);

        // 8. Execute
        const result = await db.query(querySql, params);
        const total = result.rows.length > 0 ? Number(result.rows[0].total_rows) : 0;

        const data: ProductAnalysisRow[] = result.rows.map(row => ({
            product_name: row.product_name,
            ean13: row.ean13,
            laboratory_name: row.laboratory_name,

            // Price Info (NEW)
            prix_brut: Number(row.prix_brut),
            discount_pct: Number(row.discount_pct),

            my_rank: Number(row.my_rank),
            my_sales_ttc: Number(row.my_sales_ttc),
            my_sales_qty: Number(row.my_sales_qty),
            my_purchases_ht: Number(row.my_purchases_ht),
            my_purchases_qty: Number(row.my_purchases_qty),
            my_margin_rate: Number(row.my_margin_rate),
            my_margin_ht: Number(row.my_margin_ht), // Added
            my_pdm_pct: Number(row.my_pdm_pct),
            my_pdm_purchases_pct: Number(row.my_pdm_purchases_pct), // Added

            my_stock_qty: Number(row.my_stock_qty), // Added
            my_stock_value_ht: Number(row.my_stock_value_ht), // Added
            my_days_of_stock: Number(row.my_days_of_stock), // Added

            group_rank: Number(row.group_rank),
            group_avg_sales_ttc: Number(row.group_avg_sales_ttc),
            group_avg_sales_qty: Number(row.group_avg_sales_qty),
            group_avg_purchases_ht: Number(row.group_avg_purchases_ht),
            group_avg_purchases_qty: Number(row.group_avg_purchases_qty),
            group_avg_margin_rate: Number(row.group_avg_margin_rate),
            group_pdm_pct: Number(row.group_pdm_pct),

            my_sales_evolution: Number(row.my_sales_evolution),
            group_sales_evolution: Number(row.group_sales_evolution),
            my_purchases_evolution: Number(row.my_purchases_evolution),
            group_purchases_evolution: Number(row.group_purchases_evolution),

            my_sales_qty_evolution: Number(row.my_sales_qty_evolution),
            group_sales_qty_evolution: Number(row.group_sales_qty_evolution),
            my_purchases_qty_evolution: Number(row.my_purchases_qty_evolution),
            group_purchases_qty_evolution: Number(row.group_purchases_qty_evolution),
            my_margin_rate_evolution: Number(row.my_margin_rate_evolution),
            group_margin_rate_evolution: Number(row.group_margin_rate_evolution),
            my_pdm_evolution: Number(row.my_pdm_evolution),
            group_pdm_evolution: Number(row.group_pdm_evolution),

            my_pdm_purchases_evolution: Number(row.my_pdm_purchases_evolution), // Added
            my_margin_ht_evolution: Number(row.my_margin_ht_evolution), // Added
            my_stock_qty_evolution: Number(row.my_stock_qty_evolution), // Added
            my_stock_value_ht_evolution: Number(row.my_stock_value_ht_evolution), // Added

            avg_purchase_price: Number(row.avg_purchase_price) || 0,
            avg_sell_price: Number(row.avg_sell_price) || 0,
        }));

        return { data, total };
    }
}

export const productAnalysisRepository = new ProductAnalysisRepository();

export async function getProductAnalysis(request: AchatsKpiRequest, page = 1, pageSize = 20, search = '', sortBy = 'my_sales_qty', sortOrder: 'asc' | 'desc' = 'desc', genericStatusFilter?: string, productTypeFilter?: string) {
    return productAnalysisRepository.execute(request, page, pageSize, search, sortBy, sortOrder, genericStatusFilter, productTypeFilter);
}
