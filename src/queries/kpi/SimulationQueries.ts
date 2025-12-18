
export const SimulationQueries = {
    getSimulationStats: (conditions: string) => `
    WITH current_period_stats AS (
            -- Realized Current Year (Jan to Current Month)
            SELECT
                COALESCE(SUM(mv.ttc_sold), 0) as realized_sales_ttc,
                COALESCE(SUM(mv.ht_purchased), 0) as realized_purchases_ht
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE EXTRACT(YEAR FROM mv.month) = $1::int 
              AND EXTRACT(MONTH FROM mv.month) <= $2::int
              ${conditions}
        ),
        previous_year_total AS (
            -- Previous Year Total (Jan to Dec)
            SELECT 
                COALESCE(SUM(mv.ttc_sold), 0) as prev_total_sales_ttc,
                COALESCE(SUM(mv.ht_purchased), 0) as prev_total_purchases_ht
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE EXTRACT(YEAR FROM mv.month) = ($1::int - 1)
              ${conditions}
        ),
        previous_year_remaining AS (
            -- Previous Year Remaining Period (Next Month to Dec)
            -- This is used to project the 'rest to do' based on N - 1 seasonality
            SELECT 
                COALESCE(SUM(mv.ttc_sold), 0) as prev_remaining_sales_ttc,
                COALESCE(SUM(mv.ht_purchased), 0) as prev_remaining_purchases_ht
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE EXTRACT(YEAR FROM mv.month) = ($1::int - 1)
              AND EXTRACT(MONTH FROM mv.month) > $2::int
              ${conditions}
        )
SELECT
    cp.realized_sales_ttc,
    cp.realized_purchases_ht,

    pyt.prev_total_sales_ttc,
    pyt.prev_total_purchases_ht,

    pyr.prev_remaining_sales_ttc,
    pyr.prev_remaining_purchases_ht
            
        FROM current_period_stats cp
        CROSS JOIN previous_year_total pyt
        CROSS JOIN previous_year_remaining pyr
    `
};
