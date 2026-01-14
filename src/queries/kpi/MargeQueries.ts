
export const MargeQueries = {
    SELECT: `
    SELECT 
      -- Current Period
      COALESCE(SUM(CASE WHEN mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.montant_marge ELSE 0 END), 0) as montant_marge,
      COALESCE(SUM(CASE WHEN mv.sale_date >= $1::date AND mv.sale_date <= $2::date THEN mv.montant_ht ELSE 0 END), 0) as montant_ht,
      
      -- Previous Period
      COALESCE(SUM(CASE WHEN mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.montant_marge ELSE 0 END), 0) as montant_marge_prev,
      COALESCE(SUM(CASE WHEN mv.sale_date >= $3::date AND mv.sale_date <= $4::date THEN mv.montant_ht ELSE 0 END), 0) as montant_ht_prev
    `,
    FROM: `FROM mv_sales_enriched mv`,

    JOINS: {
        LATEST_PRICES: `LEFT JOIN mv_latest_product_prices lp ON mv.internal_product_id = lp.product_id`,
        GLOBAL_PRODUCT: `LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref`
    },

    WHERE_DATE: `
    WHERE (
        (mv.sale_date >= $1::date AND mv.sale_date <= $2::date)
        OR (mv.sale_date >= $3::date AND mv.sale_date <= $4::date)
    )
    `
};
