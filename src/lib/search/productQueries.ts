// src/lib/search/productQueries.ts

/**
 * Helper to build product queries with deduplication logic
 */
function buildProductQuery(
    isUserScope: boolean,
    whereConditions: string[],
    params: any[]
) {
    // Determine table alias and column prefix
    const prefix = isUserScope ? 'dgp.' : '';

    // Base FROM clause
    const fromClause = isUserScope
        ? `FROM data_internalproduct dip
           INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref`
        : `FROM data_globalproduct`;

    // Add base constraints (ensure product link exists)
    const constraints = [
        ...whereConditions,
        `${prefix}bcb_product_id IS NOT NULL`
    ];

    // For Admin: ensure code is not null if no specific search
    if (!isUserScope && whereConditions.length === 0) {
        constraints.push('code_13_ref IS NOT NULL');
    }

    const whereClause = constraints.length > 0 ? `WHERE ${constraints.join(' AND ')}` : '';

    const selectCols = `
        ${prefix}code_13_ref,
        ${prefix}name,
        ${prefix}brand_lab,
        ${prefix}bcb_segment_l0 as universe,
        ${prefix}bcb_product_id
    `;

    const codeRef = `${prefix}code_13_ref`;

    return {
        text: `
            WITH ranked_products AS (
                SELECT 
                    ${selectCols},
                    LENGTH(${codeRef}) as code_length,
                    ROW_NUMBER() OVER (
                        PARTITION BY ${prefix}bcb_product_id 
                        ORDER BY LENGTH(${codeRef}) DESC, ${codeRef} DESC
                    ) as rn
                ${fromClause}
                ${whereClause}
            )
            SELECT 
                code_13_ref,
                name,
                brand_lab,
                universe,
                bcb_product_id
            FROM ranked_products
            WHERE rn = 1
            ORDER BY name ASC
            LIMIT 50
        `,
        params
    };
}

export const getAdminProductQuery = (searchQuery: string, isWildcard: boolean, isCodeSearch: boolean) => {
    if (!searchQuery) return buildProductQuery(false, [], []);

    if (isWildcard) {
        const cleanQuery = searchQuery.replace(/\*/g, '');
        return buildProductQuery(false, ['code_13_ref LIKE $1'], [`%${cleanQuery}`]);
    }

    if (isCodeSearch) {
        return buildProductQuery(false, ['code_13_ref LIKE $1'], [`${searchQuery}%`]);
    }

    // Name search
    return buildProductQuery(false, ['LOWER(name) LIKE LOWER($1)'], [`%${searchQuery}%`]);
};

export const getUserProductQuery = (
    searchQuery: string,
    isWildcard: boolean,
    isCodeSearch: boolean,
    pharmacyId: string
) => {
    // User scope always filters by pharmacy
    const baseCondition = 'dip.pharmacy_id = $1';

    if (!searchQuery) return buildProductQuery(true, [baseCondition], [pharmacyId]);

    if (isWildcard) {
        const cleanQuery = searchQuery.replace(/\*/g, '');
        return buildProductQuery(
            true,
            [baseCondition, 'dgp.code_13_ref LIKE $2'],
            [pharmacyId, `%${cleanQuery}`]
        );
    }

    if (isCodeSearch) {
        return buildProductQuery(
            true,
            [baseCondition, 'dgp.code_13_ref LIKE $2'],
            [pharmacyId, `${searchQuery}%`]
        );
    }

    // Name search
    return buildProductQuery(
        true,
        [baseCondition, 'LOWER(dgp.name) LIKE LOWER($2)'],
        [pharmacyId, `%${searchQuery}%`]
    );
};
