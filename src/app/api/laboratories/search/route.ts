// src/app/api/laboratories/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LaboratoryResult {
    readonly laboratory_name: string;
    readonly product_count: number;
    readonly product_codes: string[];
    readonly matching_products?: Array<{
        readonly name: string;
        readonly code_13_ref: string;
    }>;
    readonly source_type?: 'laboratory' | 'brand';
}

interface SearchParams {
    readonly query: string;
    readonly mode: 'laboratory' | 'product';
    readonly labOrBrandMode: 'laboratory' | 'brand';
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, mode, labOrBrandMode }: SearchParams = await request.json();

        // Modification: Allow empty query to return top 50
        // if (!query || query.trim().length < 2) { ... } -> Removed restriction

        if (!mode || !['laboratory', 'product'].includes(mode)) {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        if (!labOrBrandMode || !['laboratory', 'brand'].includes(labOrBrandMode)) {
            return NextResponse.json({ error: 'Invalid labOrBrandMode' }, { status: 400 });
        }

        const trimmedQuery = query ? query.trim() : '';
        const isAdmin = session.user.role === 'admin';
        const isDefaultFetch = trimmedQuery.length < 2; // Flag for default top 50 fetch

        // Choose column based on mode
        const columnName = labOrBrandMode === 'laboratory' ? 'bcb_lab' : 'bcb_brand';

        let sqlQuery: string;
        let params: any[];

        if (mode === 'laboratory') {
            // Mode laboratory/brand : direct search
            if (isAdmin) {
                sqlQuery = `
          SELECT 
            ${columnName} as laboratory_name,
            COUNT(*) as product_count,
            ARRAY_AGG(code_13_ref) as product_codes,
            '${labOrBrandMode}'::text as source_type
          FROM data_globalproduct
          WHERE ${columnName} IS NOT NULL
            ${!isDefaultFetch ? `AND LOWER(${columnName}) LIKE LOWER($1)` : ''}
          GROUP BY ${columnName}
          ORDER BY ${columnName} ASC
          LIMIT 50
        `;
                params = !isDefaultFetch ? [`%${trimmedQuery}%`] : [];
            } else {
                if (!session.user.pharmacyId) {
                    return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
                }

                sqlQuery = `
          SELECT 
            dgp.${columnName} as laboratory_name,
            COUNT(*) as product_count,
            ARRAY_AGG(dip.code_13_ref_id) as product_codes,
            '${labOrBrandMode}'::text as source_type
          FROM data_internalproduct dip
          INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
          WHERE dip.pharmacy_id = $1
            AND dgp.${columnName} IS NOT NULL
            ${!isDefaultFetch ? `AND LOWER(dgp.${columnName}) LIKE LOWER($2)` : ''}
          GROUP BY dgp.${columnName}
          ORDER BY dgp.${columnName} ASC
          LIMIT 50
        `;

                if (!isDefaultFetch) {
                    params = [session.user.pharmacyId, `%${trimmedQuery}%`];
                } else {
                    params = [session.user.pharmacyId];
                }
            }
        } else {
            // Product mode logic generic - KEEP AS IS (requires query mostly)
            const isEndCodeSearch = trimmedQuery.startsWith('*') && /^\*\d+$/.test(trimmedQuery);
            const isStartCodeSearch = /^\d+$/.test(trimmedQuery);
            const isNameSearch = !isEndCodeSearch && !isStartCodeSearch;

            // If default fetch in product mode, return empty or top labs? 
            // User asked "affiche 50 labos que tu fetch", implies Lab Mode usually.
            // Let's keep product mode strict for now or return empty if no query.
            if (isDefaultFetch) {
                return NextResponse.json({ laboratories: [], count: 0, queryTime: 0, mode, labOrBrandMode });
            }

            if (isAdmin) {
                if (isNameSearch) {
                    sqlQuery = `
                    WITH matching_products AS (
                    SELECT 
                        ${columnName},
                        name,
                        code_13_ref
                    FROM data_globalproduct
                    WHERE ${columnName} IS NOT NULL
                        AND LOWER(name) LIKE LOWER($1)
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
                    SELECT 
                        ${columnName} as laboratory_name,
                        ARRAY_AGG(code_13_ref) as product_codes
                    FROM data_globalproduct
                    WHERE ${columnName} IN (SELECT ${columnName} FROM matching_products)
                    GROUP BY ${columnName}
                    )
                    SELECT 
                    ls.laboratory_name,
                    ls.matching_count as product_count,
                    alp.product_codes,
                    ls.matching_products,
                    '${labOrBrandMode}'::text as source_type
                    FROM lab_summary ls
                    JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
                    ORDER BY ls.laboratory_name
                    LIMIT 50
                `;
                    params = [`%${trimmedQuery}%`];
                } else if (isStartCodeSearch) {
                    sqlQuery = `
                    WITH matching_products AS (
                      SELECT 
                        ${columnName},
                        name,
                        code_13_ref
                      FROM data_globalproduct
                      WHERE ${columnName} IS NOT NULL
                        AND code_13_ref LIKE $1
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
                      SELECT 
                        ${columnName} as laboratory_name,
                        ARRAY_AGG(code_13_ref) as product_codes
                      FROM data_globalproduct
                      WHERE ${columnName} IN (SELECT ${columnName} FROM matching_products)
                      GROUP BY ${columnName}
                    )
                    SELECT 
                      ls.laboratory_name,
                      ls.matching_count as product_count,
                      alp.product_codes,
                      ls.matching_products,
                      '${labOrBrandMode}'::text as source_type
                    FROM lab_summary ls
                    JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
                    ORDER BY ls.laboratory_name
                    LIMIT 50
                  `;
                    params = [`${trimmedQuery}%`];
                } else if (isEndCodeSearch) {
                    const codeDigits = trimmedQuery.substring(1);
                    sqlQuery = `
                    WITH matching_products AS (
                      SELECT 
                        ${columnName},
                        name,
                        code_13_ref
                      FROM data_globalproduct
                      WHERE ${columnName} IS NOT NULL
                        AND code_13_ref LIKE $1
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
                      SELECT 
                        ${columnName} as laboratory_name,
                        ARRAY_AGG(code_13_ref) as product_codes
                      FROM data_globalproduct
                      WHERE ${columnName} IN (SELECT ${columnName} FROM matching_products)
                      GROUP BY ${columnName}
                    )
                    SELECT 
                      ls.laboratory_name,
                      ls.matching_count as product_count,
                      alp.product_codes,
                      ls.matching_products,
                      '${labOrBrandMode}'::text as source_type
                    FROM lab_summary ls
                    JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
                    ORDER BY ls.laboratory_name
                    LIMIT 50
                  `;
                    params = [`%${codeDigits}`];
                } else {
                    return NextResponse.json({ laboratories: [] });
                }

            } else {
                if (!session.user.pharmacyId) {
                    return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
                }

                if (isNameSearch) {
                    sqlQuery = `
                    WITH matching_products AS (
                    SELECT 
                        dgp.${columnName},
                        dip.name,
                        dip.code_13_ref_id as code_13_ref
                    FROM data_internalproduct dip
                    INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
                    WHERE dip.pharmacy_id = $1
                        AND dgp.${columnName} IS NOT NULL
                        AND LOWER(dip.name) LIKE LOWER($2)
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
                    SELECT 
                        dgp.${columnName} as laboratory_name,
                        ARRAY_AGG(dip.code_13_ref_id) as product_codes
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
                    '${labOrBrandMode}'::text as source_type
                    FROM lab_summary ls
                    JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
                    ORDER BY ls.laboratory_name
                    LIMIT 50
                 `;
                    params = [session.user.pharmacyId, `%${trimmedQuery}%`];
                } else if (isStartCodeSearch) {
                    sqlQuery = `
                    WITH matching_products AS (
                      SELECT 
                        dgp.${columnName},
                        dip.name,
                        dip.code_13_ref_id as code_13_ref
                      FROM data_internalproduct dip
                      INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
                      WHERE dip.pharmacy_id = $1
                        AND dgp.${columnName} IS NOT NULL
                        AND dip.code_13_ref_id LIKE $2
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
                      SELECT 
                        dgp.${columnName} as laboratory_name,
                        ARRAY_AGG(dip.code_13_ref_id) as product_codes
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
                      '${labOrBrandMode}'::text as source_type
                    FROM lab_summary ls
                    JOIN all_lab_products alp ON ls.laboratory_name = alp.laboratory_name
                    ORDER BY ls.laboratory_name
                    LIMIT 50
                  `;
                    params = [session.user.pharmacyId, `${trimmedQuery}%`];
                } else {
                    return NextResponse.json({ laboratories: [] });
                }
            }
        }

        const startTime = Date.now();
        const laboratories = await db.query<LaboratoryResult>(sqlQuery, params);
        const queryTime = Date.now() - startTime;

        return NextResponse.json({
            laboratories: laboratories.rows,
            count: laboratories.rowCount,
            queryTime,
            mode,
            labOrBrandMode
        });

    } catch (error) {
        console.error('Erreur recherche laboratoires:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
