export const getAdminCategoryQuery = (_isDefaultFetch: boolean = false) => {
  // If default fetch, we might want to limit results or show top categories
  // But for categories, usually we search by name.

  // Base SQL for administrative/global view
  return `
      WITH all_results AS (
        -- bcb_segment_l0 (univers thérapeutique)
        SELECT 
          bcb_segment_l0 as category_name,
          'bcb_segment_l0' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_segment_l0 IS NOT NULL
          AND bcb_segment_l0 != 'NaN'
          AND LOWER(bcb_segment_l0) LIKE LOWER($1)
        GROUP BY bcb_segment_l0
        
        UNION ALL
        
        -- bcb_segment_l1
        SELECT 
          bcb_segment_l1 as category_name,
          'bcb_segment_l1' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_segment_l1 IS NOT NULL
          AND bcb_segment_l1 != 'NaN'
          AND LOWER(bcb_segment_l1) LIKE LOWER($1)
        GROUP BY bcb_segment_l1
        
        UNION ALL
        
        -- bcb_segment_l2
        SELECT 
          bcb_segment_l2 as category_name,
          'bcb_segment_l2' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_segment_l2 IS NOT NULL
          AND bcb_segment_l2 != 'NaN'
          AND LOWER(bcb_segment_l2) LIKE LOWER($1)
        GROUP BY bcb_segment_l2
        
        UNION ALL
        
        -- bcb_segment_l3
        SELECT 
          bcb_segment_l3 as category_name,
          'bcb_segment_l3' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_segment_l3 IS NOT NULL
          AND bcb_segment_l3 != 'NaN'
          AND LOWER(bcb_segment_l3) LIKE LOWER($1)
        GROUP BY bcb_segment_l3
        
        UNION ALL
        
        -- bcb_segment_l4
        SELECT 
          bcb_segment_l4 as category_name,
          'bcb_segment_l4' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_segment_l4 IS NOT NULL
          AND bcb_segment_l4 != 'NaN'
          AND LOWER(bcb_segment_l4) LIKE LOWER($1)
        GROUP BY bcb_segment_l4
        
        UNION ALL
        
        -- bcb_segment_l5
        SELECT 
          bcb_segment_l5 as category_name,
          'bcb_segment_l5' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_segment_l5 IS NOT NULL
          AND bcb_segment_l5 != 'NaN'
          AND LOWER(bcb_segment_l5) LIKE LOWER($1)
        GROUP BY bcb_segment_l5
        
        UNION ALL
        
        -- bcb_family (familles BCB)
        SELECT 
          bcb_family as category_name,
          'bcb_family' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(code_13_ref) as product_codes
        FROM data_globalproduct
        WHERE bcb_family IS NOT NULL
          AND bcb_family != 'NaN'
          AND LOWER(bcb_family) LIKE LOWER($1)
        GROUP BY bcb_family
      ),
      ranked_results AS (
        SELECT 
          category_name,
          category_type,
          product_count,
          product_codes,
          ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY product_count DESC) as rn
        FROM all_results
      )
      SELECT 
        category_name,
        category_type,
        product_count,
        product_codes
      FROM ranked_results
      WHERE rn = 1
      ORDER BY product_count DESC, category_name
      LIMIT 50
    `;
};

export const getUserCategoryQuery = (_isDefaultFetch: boolean = false) => {
  // Parameter $1 = pharmacy_id
  // Parameter $2 = query string
  return `
      WITH all_results AS (
        -- bcb_segment_l0 (univers thérapeutique)
        SELECT 
          dgp.bcb_segment_l0 as category_name,
          'bcb_segment_l0' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_segment_l0 IS NOT NULL
          AND dgp.bcb_segment_l0 != 'NaN'
          AND LOWER(dgp.bcb_segment_l0) LIKE LOWER($2)
        GROUP BY dgp.bcb_segment_l0
        
        UNION ALL
        
        -- bcb_segment_l1
        SELECT 
          dgp.bcb_segment_l1 as category_name,
          'bcb_segment_l1' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_segment_l1 IS NOT NULL
          AND dgp.bcb_segment_l1 != 'NaN'
          AND LOWER(dgp.bcb_segment_l1) LIKE LOWER($2)
        GROUP BY dgp.bcb_segment_l1
        
        UNION ALL
        
        -- bcb_segment_l2
        SELECT 
          dgp.bcb_segment_l2 as category_name,
          'bcb_segment_l2' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_segment_l2 IS NOT NULL
          AND dgp.bcb_segment_l2 != 'NaN'
          AND LOWER(dgp.bcb_segment_l2) LIKE LOWER($2)
        GROUP BY dgp.bcb_segment_l2
        
        UNION ALL
        
        -- bcb_segment_l3
        SELECT 
          dgp.bcb_segment_l3 as category_name,
          'bcb_segment_l3' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_segment_l3 IS NOT NULL
          AND dgp.bcb_segment_l3 != 'NaN'
          AND LOWER(dgp.bcb_segment_l3) LIKE LOWER($2)
        GROUP BY dgp.bcb_segment_l3
        
        UNION ALL
        
        -- bcb_segment_l4
        SELECT 
          dgp.bcb_segment_l4 as category_name,
          'bcb_segment_l4' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_segment_l4 IS NOT NULL
          AND dgp.bcb_segment_l4 != 'NaN'
          AND LOWER(dgp.bcb_segment_l4) LIKE LOWER($2)
        GROUP BY dgp.bcb_segment_l4
        
        UNION ALL
        
        -- bcb_segment_l5
        SELECT 
          dgp.bcb_segment_l5 as category_name,
          'bcb_segment_l5' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_segment_l5 IS NOT NULL
          AND dgp.bcb_segment_l5 != 'NaN'
          AND LOWER(dgp.bcb_segment_l5) LIKE LOWER($2)
        GROUP BY dgp.bcb_segment_l5
        
        UNION ALL
        
        -- bcb_family (familles BCB)
        SELECT 
          dgp.bcb_family as category_name,
          'bcb_family' as category_type,
          COUNT(*) as product_count,
          ARRAY_AGG(dip.code_13_ref_id) as product_codes
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
          AND dgp.bcb_family IS NOT NULL
          AND dgp.bcb_family != 'NaN'
          AND LOWER(dgp.bcb_family) LIKE LOWER($2)
        GROUP BY dgp.bcb_family
      ),
      ranked_results AS (
        SELECT 
          category_name,
          category_type,
          product_count,
          product_codes,
          ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY product_count DESC) as rn
        FROM all_results
      )
      SELECT 
        category_name,
        category_type,
        product_count,
        product_codes
      FROM ranked_results
      WHERE rn = 1
      ORDER BY product_count DESC, category_name
      LIMIT 50
    `;
};
