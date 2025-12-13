export const CATEGORY_LEVELS = [
  { col: 'bcb_segment_l0', type: 'bcb_segment_l0' },
  { col: 'bcb_segment_l1', type: 'bcb_segment_l1' },
  { col: 'bcb_segment_l2', type: 'bcb_segment_l2' },
  { col: 'bcb_segment_l3', type: 'bcb_segment_l3' },
  { col: 'bcb_segment_l4', type: 'bcb_segment_l4' },
  { col: 'bcb_segment_l5', type: 'bcb_segment_l5' },
  { col: 'bcb_family', type: 'bcb_family' },
];

const generateSegmentQuery = (
  level: { col: string; type: string },
  isUser: boolean
) => {
  const { col, type } = level;
  const selectClause = isUser
    ? `dgp.${col} as category_name, '${type}' as category_type, COUNT(*) as product_count, ARRAY_AGG(dip.code_13_ref_id) as product_codes`
    : `${col} as category_name, '${type}' as category_type, COUNT(*) as product_count, ARRAY_AGG(code_13_ref) as product_codes`;

  const fromClause = isUser
    ? `FROM data_internalproduct dip INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref`
    : `FROM data_globalproduct`;

  const whereClause = isUser
    ? `WHERE dip.pharmacy_id = $1 AND dgp.${col} IS NOT NULL AND dgp.${col} != 'NaN' AND LOWER(dgp.${col}) LIKE LOWER($2)`
    : `WHERE ${col} IS NOT NULL AND ${col} != 'NaN' AND LOWER(${col}) LIKE LOWER($1)`;

  const groupBy = isUser ? `GROUP BY dgp.${col}` : `GROUP BY ${col}`;

  return `
    SELECT ${selectClause}
    ${fromClause}
    ${whereClause}
    ${groupBy}
  `;
};

export const getAdminCategoryQuery = (_isDefaultFetch: boolean = false) => {
  const queries = CATEGORY_LEVELS.map(l => generateSegmentQuery(l, false)).join(' UNION ALL ');

  return `
      WITH all_results AS (
        ${queries}
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
      SELECT category_name, category_type, product_count, product_codes
      FROM ranked_results
      WHERE rn = 1
      ORDER BY product_count DESC, category_name
      LIMIT 50
    `;
};

export const getUserCategoryQuery = (_isDefaultFetch: boolean = false) => {
  const queries = CATEGORY_LEVELS.map(l => generateSegmentQuery(l, true)).join(' UNION ALL ');

  return `
      WITH all_results AS (
        ${queries}
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
      SELECT category_name, category_type, product_count, product_codes
      FROM ranked_results
      WHERE rn = 1
      ORDER BY product_count DESC, category_name
      LIMIT 50
    `;
};
