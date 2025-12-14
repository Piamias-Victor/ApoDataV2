
export const MargeQueries = {
    SELECT: `
    SELECT 
      COALESCE(SUM(mv.montant_marge), 0) as montant_marge,
      COALESCE(SUM(mv.montant_ht), 0) as montant_ht
    `,
    FROM: `FROM mv_sales_enriched mv`,

    JOINS: {
        LATEST_PRICES: `LEFT JOIN mv_latest_product_prices lp ON mv.internal_product_id = lp.product_id`,
        GLOBAL_PRODUCT: `LEFT JOIN data_globalproduct gp ON mv.code_13_ref = gp.code_13_ref`
    },

    WHERE_DATE: `
    WHERE mv.sale_date >= $1::date 
      AND mv.sale_date <= $2::date
    `
};
