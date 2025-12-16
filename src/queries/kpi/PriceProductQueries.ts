export const PriceProductQueries = {
    getProductAnalysis: (
        conditions: string,
        searchCondition: string,
        limitIdx: number,
        offsetIdx: number,
        finalOrderByClause: string,
        pharmacyParamIdx: number
    ) => `
WITH
--1. Base filtered data(Optimization: Filter early)
        base_data AS(
    SELECT 
                mv.ean13,
    mv.pharmacy_id,
    mv.product_label,
    mv.laboratory_name,
    mv.ht_purchased,
    mv.qty_purchased,
    mv.ttc_sold,
    mv.qty_sold,
    mv.margin_sold,
    mv.ht_sold,
    mv.month,
    gp.bcb_tva_rate as vat_rate
            FROM mv_product_stats_monthly mv
            -- Inner Join for Global Products required for filters (Laboratory, Category, etc.)
            INNER JOIN data_internalproduct ip ON mv.product_id = ip.id
            LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
            WHERE 
                (
                    (mv.month >= $1:: date AND mv.month <= $2:: date) -- Current Period
                    OR 
                    (mv.month >= $3:: date AND mv.month <= $4:: date) -- Previous Period
                )
                ${conditions}
                ${searchCondition}
),

    --2. Per Pharmacy Stats(For Min / Max calculations - EXCLUDE ZEROS)
        pharmacy_stats AS(
        SELECT 
                ean13,
        pharmacy_id,
        SUM(CASE WHEN month >= $1::date THEN ht_purchased ELSE 0 END) / NULLIF(SUM(CASE WHEN month >= $1::date THEN qty_purchased ELSE 0 END), 0) as avg_purchases_unit,
        SUM(CASE WHEN month >= $1::date THEN ttc_sold ELSE 0 END) / NULLIF(SUM(CASE WHEN month >= $1::date THEN qty_sold ELSE 0 END), 0) as avg_sales_unit
            FROM base_data
            GROUP BY ean13, pharmacy_id
    ),

        group_aggregates AS(
            SELECT
                p.ean13,
            -- Use NULLIF to exclude 0 from MIN calculations
            MIN(NULLIF(p.avg_purchases_unit, 0)) as group_min_purchase_price,
            MAX(p.avg_purchases_unit) as group_max_purchase_price,
            MIN(NULLIF(p.avg_sales_unit, 0)) as group_min_sell_price,
            MAX(p.avg_sales_unit) as group_max_sell_price
             FROM pharmacy_stats p
             GROUP BY p.ean13
        ),

            --4. My Stats(Scope "Me" = Selected Pharmacies)
        my_stats AS(
                SELECT 
                bd.ean13,
                MAX(bd.product_label) as product_name,
                MAX(bd.laboratory_name) as laboratory_name,
                MAX(bd.vat_rate) as vat_rate,

                -- Current Period Stats ($1 - $2)
                SUM(CASE WHEN(bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.ht_purchased ELSE 0 END) as my_purchases_ht,
                SUM(CASE WHEN(bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.qty_purchased ELSE 0 END) as my_purchases_qty,
                SUM(CASE WHEN(bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.ttc_sold ELSE 0 END) as my_sales_ttc,
                SUM(CASE WHEN(bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.qty_sold ELSE 0 END) as my_sales_qty,
                SUM(CASE WHEN(bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.margin_sold ELSE 0 END) as my_margin_ht,
                SUM(CASE WHEN(bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.ht_sold ELSE 0 END) as my_sales_ht,
                
                -- Previous Period Stats ($3 - $4)
                SUM(CASE WHEN(bd.month < $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.ht_purchased ELSE 0 END) as prev_purchases_ht,
                SUM(CASE WHEN(bd.month < $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.qty_purchased ELSE 0 END) as prev_purchases_qty,
                SUM(CASE WHEN(bd.month < $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.ttc_sold ELSE 0 END) as prev_sales_ttc,
                SUM(CASE WHEN(bd.month < $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.qty_sold ELSE 0 END) as prev_sales_qty,
                SUM(CASE WHEN(bd.month < $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.margin_sold ELSE 0 END) as prev_margin_ht,
                SUM(CASE WHEN(bd.month < $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx}))) THEN bd.ht_sold ELSE 0 END) as prev_sales_ht,

                -- Latest Month Metrics for "Current Price" (Scope Me)
                -- We use strict filtering to only include relevant rows in the array
                -- CRITICAL: Use same condition for both to avoid desync (e.g. Month A has Qty, Month B has Price)
                (ARRAY_AGG(bd.ttc_sold ORDER BY bd.month DESC) 
                    FILTER (WHERE bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx})) AND bd.qty_sold > 0 AND bd.ttc_sold > 0)
                )[1] as my_last_sales_ttc,
                
                (ARRAY_AGG(bd.qty_sold ORDER BY bd.month DESC)
                    FILTER (WHERE bd.month >= $1::date AND ($${pharmacyParamIdx}:: uuid[] IS NULL OR bd.pharmacy_id = ANY($${pharmacyParamIdx})) AND bd.qty_sold > 0 AND bd.ttc_sold > 0)
                )[1] as my_last_sales_qty,

                --Group totals (Current Period)
                SUM(CASE WHEN month >= $1::date THEN bd.ht_purchased ELSE 0 END) as group_purchases_ht,
    SUM(CASE WHEN month >= $1::date THEN bd.qty_purchased ELSE 0 END) as group_purchases_qty,
    SUM(CASE WHEN month >= $1::date THEN bd.ttc_sold ELSE 0 END) as group_sales_ttc,
    SUM(CASE WHEN month >= $1::date THEN bd.qty_sold ELSE 0 END) as group_sales_qty

            FROM base_data bd
            GROUP BY bd.ean13
        )

SELECT
ms.product_name,
    ms.ean13,
    ms.laboratory_name,

    --Purchasing
    ga.group_min_purchase_price,
    ga.group_max_purchase_price,
    
    -- My Avg Purchase Price & Evolution
    CASE WHEN ms.my_purchases_qty = 0 THEN 0 ELSE ms.my_purchases_ht / ms.my_purchases_qty END as my_avg_purchase_price,
    CASE WHEN ms.prev_purchases_qty = 0 THEN 0 ELSE ms.prev_purchases_ht / ms.prev_purchases_qty END as prev_avg_purchase_price,

    CASE WHEN ms.group_purchases_qty = 0 THEN 0 ELSE ms.group_purchases_ht / ms.group_purchases_qty END as group_avg_purchase_price,

    --Selling
    ga.group_min_sell_price,
    ga.group_max_sell_price,
    
    -- My Avg Sell Price & Evolution
    CASE WHEN ms.my_sales_qty = 0 THEN 0 ELSE ms.my_sales_ttc / ms.my_sales_qty END as my_avg_sell_price,
    CASE WHEN ms.prev_sales_qty = 0 THEN 0 ELSE ms.prev_sales_ttc / ms.prev_sales_qty END as prev_avg_sell_price,

    CASE WHEN ms.group_sales_qty = 0 THEN 0 ELSE ms.group_sales_ttc / ms.group_sales_qty END as group_avg_sell_price,

    --Current Price (Last observed)
    ms.my_last_sales_ttc,
    ms.my_last_sales_qty,

--Margin % & Evolution
    CASE WHEN ms.my_sales_ht = 0 THEN 0 ELSE(ms.my_margin_ht / ms.my_sales_ht) * 100 END as my_margin_rate,
    CASE WHEN ms.prev_sales_ht = 0 THEN 0 ELSE(ms.prev_margin_ht / ms.prev_sales_ht) * 100 END as prev_margin_rate,

        --Count for pagination
            COUNT(*) OVER() as total_rows,
            ms.vat_rate

        FROM my_stats ms
        JOIN group_aggregates ga ON ms.ean13 = ga.ean13
        ${finalOrderByClause}
        LIMIT $${limitIdx}::int OFFSET $${offsetIdx}:: int
    `
};
