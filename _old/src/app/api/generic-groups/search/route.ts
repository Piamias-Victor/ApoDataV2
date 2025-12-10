// src/app/api/generic-groups/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GenericGroupResult {
  readonly generic_group: string;
  readonly product_count: number;
  readonly referent_name: string | null;
  readonly referent_code: string | null;
  readonly referent_lab: string | null;
  readonly generic_count: number;
  readonly product_codes: string[];
}

interface SearchParams {
  readonly query: string;
  readonly mode: 'group' | 'molecule' | 'code';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, mode }: SearchParams = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ groups: [] });
    }

    if (!mode || !['group', 'molecule', 'code'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    const isAdmin = session.user.role === 'admin';
    
    let sqlQuery: string;
    let params: any[];

    if (isAdmin) {
      if (mode === 'group' || mode === 'molecule') {
        sqlQuery = `
          WITH group_stats AS (
            SELECT 
              bcb_generic_group,
              COUNT(*) as product_count,
              COUNT(CASE WHEN bcb_generic_status = 'GÉNÉRIQUE' THEN 1 END) as generic_count,
              MAX(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN name END) as referent_name,
              MAX(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN code_13_ref END) as referent_code,
              MAX(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN bcb_lab END) as referent_lab,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_generic_group IS NOT NULL
              AND LOWER(bcb_generic_group) LIKE LOWER($1)
            GROUP BY bcb_generic_group
          )
          SELECT 
            bcb_generic_group as generic_group,
            product_count,
            referent_name,
            referent_code,
            referent_lab,
            generic_count,
            product_codes
          FROM group_stats
          ORDER BY bcb_generic_group
          LIMIT 50
        `;
        params = [`%${trimmedQuery}%`];
      } else if (mode === 'code') {
        sqlQuery = `
          WITH matching_groups AS (
            SELECT DISTINCT bcb_generic_group
            FROM data_globalproduct
            WHERE code_13_ref LIKE $1
              AND bcb_generic_group IS NOT NULL
          ),
          group_stats AS (
            SELECT 
              bcb_generic_group,
              COUNT(*) as product_count,
              COUNT(CASE WHEN bcb_generic_status = 'GÉNÉRIQUE' THEN 1 END) as generic_count,
              MAX(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN name END) as referent_name,
              MAX(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN code_13_ref END) as referent_code,
              MAX(CASE WHEN bcb_generic_status = 'RÉFÉRENT' THEN bcb_lab END) as referent_lab,
              ARRAY_AGG(code_13_ref) as product_codes
            FROM data_globalproduct
            WHERE bcb_generic_group IN (SELECT bcb_generic_group FROM matching_groups)
            GROUP BY bcb_generic_group
          )
          SELECT 
            bcb_generic_group as generic_group,
            product_count,
            referent_name,
            referent_code,
            referent_lab,
            generic_count,
            product_codes
          FROM group_stats
          ORDER BY bcb_generic_group
          LIMIT 50
        `;
        params = [`${trimmedQuery}%`];
      }
    } else {
      if (!session.user.pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 });
      }

      if (mode === 'group' || mode === 'molecule') {
        sqlQuery = `
          WITH pharmacy_groups AS (
            SELECT DISTINCT dgp.bcb_generic_group
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_generic_group IS NOT NULL
              AND LOWER(dgp.bcb_generic_group) LIKE LOWER($2)
          ),
          group_stats AS (
            SELECT 
              dgp.bcb_generic_group,
              COUNT(*) as product_count,
              COUNT(CASE WHEN dgp.bcb_generic_status = 'GÉNÉRIQUE' THEN 1 END) as generic_count,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN dip.name END) as referent_name,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN dip.code_13_ref_id END) as referent_code,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN dgp.bcb_lab END) as referent_lab,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_generic_group IN (SELECT bcb_generic_group FROM pharmacy_groups)
            GROUP BY dgp.bcb_generic_group
          )
          SELECT 
            bcb_generic_group as generic_group,
            product_count,
            referent_name,
            referent_code,
            referent_lab,
            generic_count,
            product_codes
          FROM group_stats
          ORDER BY bcb_generic_group
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `%${trimmedQuery}%`];
      } else if (mode === 'code') {
        sqlQuery = `
          WITH matching_groups AS (
            SELECT DISTINCT dgp.bcb_generic_group
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dip.code_13_ref_id LIKE $2
              AND dgp.bcb_generic_group IS NOT NULL
          ),
          group_stats AS (
            SELECT 
              dgp.bcb_generic_group,
              COUNT(*) as product_count,
              COUNT(CASE WHEN dgp.bcb_generic_status = 'GÉNÉRIQUE' THEN 1 END) as generic_count,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN dip.name END) as referent_name,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN dip.code_13_ref_id END) as referent_code,
              MAX(CASE WHEN dgp.bcb_generic_status = 'RÉFÉRENT' THEN dgp.bcb_lab END) as referent_lab,
              ARRAY_AGG(dip.code_13_ref_id) as product_codes
            FROM data_internalproduct dip
            INNER JOIN data_globalproduct dgp ON dip.code_13_ref_id = dgp.code_13_ref
            WHERE dip.pharmacy_id = $1
              AND dgp.bcb_generic_group IN (SELECT bcb_generic_group FROM matching_groups)
            GROUP BY dgp.bcb_generic_group
          )
          SELECT 
            bcb_generic_group as generic_group,
            product_count,
            referent_name,
            referent_code,
            referent_lab,
            generic_count,
            product_codes
          FROM group_stats
          ORDER BY bcb_generic_group
          LIMIT 50
        `;
        params = [session.user.pharmacyId, `${trimmedQuery}%`];
      }
    }

    const startTime = Date.now();
    const groups = await db.query<GenericGroupResult>(sqlQuery!, params!);
    const queryTime = Date.now() - startTime;

    if (queryTime > 500) {
      console.warn(`Requête groupes génériques lente (${queryTime}ms):`, trimmedQuery, mode);
    }

    return NextResponse.json({
      groups,
      count: groups.length,
      queryTime,
      mode
    });

  } catch (error) {
    console.error('Erreur recherche groupes génériques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}