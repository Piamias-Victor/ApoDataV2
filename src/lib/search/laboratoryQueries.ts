// src/lib/search/laboratoryQueries.ts

/**
 * REUSABLE SQL FRAGMENTS
 * These constants act as "variables" for your SQL queries, making them modular and readable.
 */
const BASE_SELECT_FIELDS = (columnName: string, mode: string) => `
    ${columnName} as laboratory_name,
    COUNT(*) as product_count,
    ARRAY_AGG(code_13_ref) as product_codes,
    '${mode}'::text as source_type
`;

const USER_SELECT_FIELDS = (columnName: string, mode: string) => `
    dgp.${columnName} as laboratory_name,
    COUNT(*) as product_count,
    ARRAY_AGG(dip.code_13_ref_id) as product_codes,
    '${mode}'::text as source_type
`;

/**
 * QUERY GENERATORS
 */

export const getAdminLaboratoryQuery = (columnName: string, mode: string, isDefaultFetch: boolean) => {
    return `
        SELECT ${BASE_SELECT_FIELDS(columnName, mode)}
        FROM data_globalproduct
        WHERE ${columnName} IS NOT NULL
        ${!isDefaultFetch ? `AND LOWER(${columnName}) LIKE LOWER($1)` : ''}
        GROUP BY ${columnName}
        ORDER BY ${columnName} ASC
        LIMIT 50
    `;
};

export const getUserLaboratoryQuery = (columnName: string, mode: string, isDefaultFetch: boolean) => {
    return `
        SELECT ${USER_SELECT_FIELDS(columnName, mode)}
        FROM data_internalproduct dip
        INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
        WHERE dip.pharmacy_id = $1
        AND dgp.${columnName} IS NOT NULL
        ${!isDefaultFetch ? `AND LOWER(dgp.${columnName}) LIKE LOWER($2)` : ''}
        GROUP BY dgp.${columnName}
        ORDER BY dgp.${columnName} ASC
        LIMIT 50
    `;
};

/**
 * Complex Product Mode Queries (Admin)
 */
export const getAdminProductSearchQuery = (columnName: string, mode: string, searchType: 'NAME' | 'CODE_START' | 'CODE_END') => {
    const whereClause = {
        NAME: `LOWER(name) LIKE LOWER($1)`,
        CODE_START: `code_13_ref LIKE $1`,
        CODE_END: `code_13_ref LIKE $1`
    }[searchType];

    return `
        WITH matching_products AS (
            SELECT ${columnName}, name, code_13_ref
            FROM data_globalproduct
            WHERE ${columnName} IS NOT NULL AND ${whereClause}
        ),
        lab_summary AS (
            SELECT 
                ${columnName} as laboratory_name,
                COUNT(*) as matching_count,
                JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
            FROM matching_products
            GROUP BY ${columnName}
        ),
        all_lab_products AS (
            SELECT ${columnName} as laboratory_name, ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE ${columnName} IN (SELECT ${columnName} FROM matching_products)
            GROUP BY ${columnName}
        )
        SELECT 
            ls.laboratory_name,
            ls.matching_count as product_count,
            alp.product_codes,
            ls.matching_products,
            '${mode}'::text as source_type
        FROM lab_summary ls
        JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
        ORDER BY ls.laboratory_name
        LIMIT 50
    `;
};

/**
 * Complex Product Mode Queries (User)
 */
export const getUserProductSearchQuery = (columnName: string, mode: string, searchType: 'NAME' | 'CODE_START') => {
    const whereClause = {
        NAME: `LOWER(dip.name) LIKE LOWER($2)`,
        CODE_START: `dip.code_13_ref_id LIKE $2`
    }[searchType];

    return `
        WITH matching_products AS (
            SELECT dgp.${columnName}, dip.name, dip.code_13_ref_id as code_13_ref
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
            AND dgp.${columnName} IS NOT NULL
            AND ${whereClause}
        ),
        lab_summary AS (
            SELECT ${columnName} as laboratory_name, COUNT(*) as matching_count,
            JSON_AGG(JSON_BUILD_OBJECT('name', name, 'code_13_ref', code_13_ref)) as matching_products
            FROM matching_products
            GROUP BY ${columnName}
        ),
        all_lab_products AS (
            SELECT dgp.${columnName} as laboratory_name, ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
            AND dgp.${columnName} IN (SELECT ${columnName} FROM matching_products)
            GROUP BY dgp.${columnName}
        )
        SELECT 
            ls.laboratory_name,
            ls.matching_count as product_count,
            alp.product_codes,
            ls.matching_products,
            '${mode}'::text as source_type
        FROM lab_summary ls
        JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
        ORDER BY ls.laboratory_name
        LIMIT 50
    `;
};
