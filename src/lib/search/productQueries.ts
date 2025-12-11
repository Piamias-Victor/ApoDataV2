// src/lib/search/productQueries.ts

/**
 * Product Search Query Helpers
 * Supports three search modes:
 * 1. Name search (letters): LOWER(name) LIKE LOWER($1)
 * 2. Code search (numbers): code_13_ref LIKE $1% (starts with)
 * 3. Wildcard search (*): code_13_ref LIKE %$1 (ends with)
 * 
 * DEDUPLICATION: Groups by bcb_product_id and keeps the longest code (EAN13 > CIP7)
 */

export const getAdminProductQuery = (searchQuery: string, isWildcard: boolean, isCodeSearch: boolean) => {
    // Default: Return 50 products
    if (!searchQuery) {
        return {
            text: `
                WITH ranked_products AS (
                    SELECT 
                        code_13_ref,
                        name,
                        brand_lab,
                        bcb_segment_l0 as universe,
                        bcb_product_id,
                        LENGTH(code_13_ref) as code_length,
                        ROW_NUMBER() OVER (
                            PARTITION BY bcb_product_id 
                            ORDER BY LENGTH(code_13_ref) DESC, code_13_ref DESC
                        ) as rn
                    FROM data_globalproduct
                    WHERE code_13_ref IS NOT NULL
                      AND bcb_product_id IS NOT NULL
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
            params: []
        };
    }

    // Wildcard search: ends with
    if (isWildcard) {
        const cleanQuery = searchQuery.replace('*', '');
        return {
            text: `
                WITH ranked_products AS (
                    SELECT 
                        code_13_ref,
                        name,
                        brand_lab,
                        bcb_segment_l0 as universe,
                        bcb_product_id,
                        LENGTH(code_13_ref) as code_length,
                        ROW_NUMBER() OVER (
                            PARTITION BY bcb_product_id 
                            ORDER BY LENGTH(code_13_ref) DESC, code_13_ref DESC
                        ) as rn
                    FROM data_globalproduct
                    WHERE code_13_ref LIKE $1
                      AND bcb_product_id IS NOT NULL
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
            params: [`%${cleanQuery}`]
        };
    }

    // Code search: starts with
    if (isCodeSearch) {
        return {
            text: `
                WITH ranked_products AS (
                    SELECT 
                        code_13_ref,
                        name,
                        brand_lab,
                        bcb_segment_l0 as universe,
                        bcb_product_id,
                        LENGTH(code_13_ref) as code_length,
                        ROW_NUMBER() OVER (
                            PARTITION BY bcb_product_id 
                            ORDER BY LENGTH(code_13_ref) DESC, code_13_ref DESC
                        ) as rn
                    FROM data_globalproduct
                    WHERE code_13_ref LIKE $1
                      AND bcb_product_id IS NOT NULL
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
            params: [`${searchQuery}%`]
        };
    }

    // Name search
    return {
        text: `
            WITH ranked_products AS (
                SELECT 
                    code_13_ref,
                    name,
                    brand_lab,
                    bcb_segment_l0 as universe,
                    bcb_product_id,
                    LENGTH(code_13_ref) as code_length,
                    ROW_NUMBER() OVER (
                        PARTITION BY bcb_product_id 
                        ORDER BY LENGTH(code_13_ref) DESC, code_13_ref DESC
                    ) as rn
                FROM data_globalproduct
                WHERE LOWER(name) LIKE LOWER($1)
                  AND bcb_product_id IS NOT NULL
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
        params: [`%${searchQuery}%`]
    };
};

export const getUserProductQuery = (
    searchQuery: string,
    isWildcard: boolean,
    isCodeSearch: boolean,
    pharmacyId: string
) => {
    // Default: Return 50 products for this pharmacy
    if (!searchQuery) {
        return {
            text: `
                WITH ranked_products AS (
                    SELECT 
                        dgp.code_13_ref,
                        dgp.name,
                        dgp.brand_lab,
                        dgp.bcb_segment_l0 as universe,
                        dgp.bcb_product_id,
                        LENGTH(dgp.code_13_ref) as code_length,
                        ROW_NUMBER() OVER (
                            PARTITION BY dgp.bcb_product_id 
                            ORDER BY LENGTH(dgp.code_13_ref) DESC, dgp.code_13_ref DESC
                        ) as rn
                    FROM data_internalproduct dip
                    INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
                    WHERE dip.pharmacy_id = $1
                      AND dgp.bcb_product_id IS NOT NULL
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
            params: [pharmacyId]
        };
    }

    // Wildcard search: ends with
    if (isWildcard) {
        const cleanQuery = searchQuery.replace('*', '');
        return {
            text: `
                WITH ranked_products AS (
                    SELECT 
                        dgp.code_13_ref,
                        dgp.name,
                        dgp.brand_lab,
                        dgp.bcb_segment_l0 as universe,
                        dgp.bcb_product_id,
                        LENGTH(dgp.code_13_ref) as code_length,
                        ROW_NUMBER() OVER (
                            PARTITION BY dgp.bcb_product_id 
                            ORDER BY LENGTH(dgp.code_13_ref) DESC, dgp.code_13_ref DESC
                        ) as rn
                    FROM data_internalproduct dip
                    INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
                    WHERE dip.pharmacy_id = $1
                      AND dgp.code_13_ref LIKE $2
                      AND dgp.bcb_product_id IS NOT NULL
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
            params: [pharmacyId, `%${cleanQuery}`]
        };
    }

    // Code search: starts with
    if (isCodeSearch) {
        return {
            text: `
                WITH ranked_products AS (
                    SELECT 
                        dgp.code_13_ref,
                        dgp.name,
                        dgp.brand_lab,
                        dgp.bcb_segment_l0 as universe,
                        dgp.bcb_product_id,
                        LENGTH(dgp.code_13_ref) as code_length,
                        ROW_NUMBER() OVER (
                            PARTITION BY dgp.bcb_product_id 
                            ORDER BY LENGTH(dgp.code_13_ref) DESC, dgp.code_13_ref DESC
                        ) as rn
                    FROM data_internalproduct dip
                    INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
                    WHERE dip.pharmacy_id = $1
                      AND dgp.code_13_ref LIKE $2
                      AND dgp.bcb_product_id IS NOT NULL
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
            params: [pharmacyId, `${searchQuery}%`]
        };
    }

    // Name search
    return {
        text: `
            WITH ranked_products AS (
                SELECT 
                    dgp.code_13_ref,
                    dgp.name,
                    dgp.brand_lab,
                    dgp.bcb_segment_l0 as universe,
                    dgp.bcb_product_id,
                    LENGTH(dgp.code_13_ref) as code_length,
                    ROW_NUMBER() OVER (
                        PARTITION BY dgp.bcb_product_id 
                        ORDER BY LENGTH(dgp.code_13_ref) DESC, dgp.code_13_ref DESC
                    ) as rn
                FROM data_internalproduct dip
                INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
                WHERE dip.pharmacy_id = $1
                  AND LOWER(dgp.name) LIKE LOWER($2)
                  AND dgp.bcb_product_id IS NOT NULL
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
        params: [pharmacyId, `%${searchQuery}%`]
    };
};
