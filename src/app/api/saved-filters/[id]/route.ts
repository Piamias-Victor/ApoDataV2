// src/app/api/saved-filters/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SavedFilter, LoadFilterResult, RenameFilterPayload } from '@/types/savedFilters';

/**
 * GET /api/saved-filters/[id]
 * Récupère un filtre + résout les codes produits pour labos et catégories
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const filterId = params.id;

    // 1. Récupérer le filtre
    const filterQuery = `
      SELECT 
        id,
        user_id,
        pharmacy_ids,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        analysis_date_start,
        analysis_date_end,
        comparison_date_start,
        comparison_date_end,
        created_at,
        updated_at
      FROM public.data_savedfilter
      WHERE id = $1 AND user_id = $2
    `;

    const filterRows = await db.query(filterQuery, [filterId, userId]);

    if (filterRows.length === 0) {
      return NextResponse.json(
        { error: 'Filtre non trouvé' },
        { status: 404 }
      );
    }

    const filter: SavedFilter = {
      id: filterRows[0].id,
      user_id: filterRows[0].user_id,
      pharmacy_ids: filterRows[0].pharmacy_ids || [],
      name: filterRows[0].name,
      product_codes: filterRows[0].product_codes || [],
      laboratory_names: filterRows[0].laboratory_names || [],
      category_names: filterRows[0].category_names || [],
      category_types: filterRows[0].category_types || [],
      analysis_date_start: filterRows[0].analysis_date_start,
      analysis_date_end: filterRows[0].analysis_date_end,
      comparison_date_start: filterRows[0].comparison_date_start,
      comparison_date_end: filterRows[0].comparison_date_end,
      created_at: filterRows[0].created_at,
      updated_at: filterRows[0].updated_at,
    };

    // 2. Résoudre les codes produits pour chaque laboratoire
    const resolvedLaboratories: LoadFilterResult['resolvedLaboratories'] = [];
    
    if (filter.laboratory_names.length > 0) {
      const labQuery = `
        SELECT 
          bcb_lab as laboratory_name,
          ARRAY_AGG(DISTINCT code_13_ref) as product_codes,
          COUNT(DISTINCT code_13_ref) as product_count
        FROM public.data_globalproduct
        WHERE REGEXP_REPLACE(TRIM(bcb_lab), '\\s+', ' ', 'g') = ANY(
          SELECT REGEXP_REPLACE(TRIM(unnest($1::text[])), '\\s+', ' ', 'g')
        )
        GROUP BY bcb_lab
      `;

      const labRows = await db.query(labQuery, [filter.laboratory_names]);

      for (const row of labRows) {
        resolvedLaboratories.push({
          name: row.laboratory_name,
          productCodes: row.product_codes || [],
          productCount: parseInt(row.product_count) || 0,
        });
      }
    }

    // 3. Résoudre les codes produits pour chaque catégorie
    const resolvedCategories: LoadFilterResult['resolvedCategories'] = [];
    
    if (filter.category_names.length > 0) {
      for (let i = 0; i < filter.category_names.length; i++) {
        const categoryName = filter.category_names[i];
        const categoryType = filter.category_types[i];

        if (!categoryName || !categoryType) continue;

        const column = categoryType === 'universe' ? 'universe' : 'category';

        const catQuery = `
          SELECT 
            ARRAY_AGG(DISTINCT code_13_ref) as product_codes,
            COUNT(DISTINCT code_13_ref) as product_count
          FROM public.data_globalproduct
          WHERE REGEXP_REPLACE(TRIM(${column}), '\\s+', ' ', 'g') = REGEXP_REPLACE(TRIM($1), '\\s+', ' ', 'g')
        `;

        const catRows = await db.query(catQuery, [categoryName]);

        if (catRows.length > 0) {
          resolvedCategories.push({
            name: categoryName,
            type: categoryType,
            productCodes: catRows[0].product_codes || [],
            productCount: parseInt(catRows[0].product_count) || 0,
          });
        }
      }
    }

    // 4. Résoudre les infos complètes des pharmacies
    const resolvedPharmacies: Array<{
      readonly id: string;
      readonly name: string;
      readonly address: string | null;
      readonly ca: number | null;
      readonly area: string | null;
      readonly employees_count: number | null;
      readonly id_nat: string | null;
    }> = [];

    if (filter.pharmacy_ids.length > 0) {
      const pharmacyQuery = `
        SELECT 
          id,
          name,
          address,
          ca,
          area,
          employees_count,
          id_nat
        FROM public.data_pharmacy
        WHERE id = ANY($1::uuid[])
      `;

      const pharmacyRows = await db.query(pharmacyQuery, [filter.pharmacy_ids]);

      for (const row of pharmacyRows) {
        resolvedPharmacies.push({
          id: row.id,
          name: row.name || 'Pharmacie inconnue',
          address: row.address,
          ca: row.ca ? parseFloat(row.ca.toString()) : null,
          area: row.area,
          employees_count: row.employees_count ? parseInt(row.employees_count.toString()) : null,
          id_nat: row.id_nat,
        });
      }
    }

    // 5. Agréger tous les codes produits
    const allProductCodes = new Set<string>(filter.product_codes);

    resolvedLaboratories.forEach(lab => {
      lab.productCodes.forEach(code => allProductCodes.add(code));
    });

    resolvedCategories.forEach(cat => {
      cat.productCodes.forEach(code => allProductCodes.add(code));
    });

    const result: LoadFilterResult = {
      filter,
      resolvedProductCodes: Array.from(allProductCodes),
      resolvedLaboratories,
      resolvedCategories,
      resolvedPharmacies,
    };

    console.log('✅ [GET /api/saved-filters/[id]] Filter loaded:', {
      id: filter.id,
      name: filter.name,
      totalProducts: result.resolvedProductCodes.length,
      laboratories: resolvedLaboratories.length,
      categories: resolvedCategories.length,
      pharmacies: resolvedPharmacies.length,
      dates: `${filter.analysis_date_start} → ${filter.analysis_date_end}`,
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('❌ [GET /api/saved-filters/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du filtre' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/saved-filters/[id]
 * Renomme un filtre sauvegardé
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const filterId = params.id;

    const body: RenameFilterPayload = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du filtre est obligatoire' },
        { status: 400 }
      );
    }

    if (body.name.length > 255) {
      return NextResponse.json(
        { error: 'Le nom du filtre est trop long (max 255 caractères)' },
        { status: 400 }
      );
    }

    // Récupérer le nom actuel avant update
    const getCurrentNameQuery = `
      SELECT name 
      FROM public.data_savedfilter 
      WHERE id = $1 AND user_id = $2
    `;
    const currentNameRows = await db.query(getCurrentNameQuery, [filterId, userId]);
    const oldName = currentNameRows[0]?.name || 'Unknown';

    const query = `
      UPDATE public.data_savedfilter
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING 
        id,
        user_id,
        pharmacy_ids,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        analysis_date_start,
        analysis_date_end,
        comparison_date_start,
        comparison_date_end,
        created_at,
        updated_at
    `;

    const rows = await db.query(query, [body.name.trim(), filterId, userId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Filtre non trouvé' },
        { status: 404 }
      );
    }

    const updatedFilter: SavedFilter = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      pharmacy_ids: rows[0].pharmacy_ids || [],
      name: rows[0].name,
      product_codes: rows[0].product_codes || [],
      laboratory_names: rows[0].laboratory_names || [],
      category_names: rows[0].category_names || [],
      category_types: rows[0].category_types || [],
      analysis_date_start: rows[0].analysis_date_start,
      analysis_date_end: rows[0].analysis_date_end,
      comparison_date_start: rows[0].comparison_date_start,
      comparison_date_end: rows[0].comparison_date_end,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    };

    console.log('✅ [PATCH /api/saved-filters/[id]] Filter renamed:', {
      id: updatedFilter.id,
      oldName,
      newName: updatedFilter.name,
    });

    return NextResponse.json({ filter: updatedFilter }, { status: 200 });

  } catch (error) {
    console.error('❌ [PATCH /api/saved-filters/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du renommage du filtre' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved-filters/[id]
 * Supprime un filtre sauvegardé
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const filterId = params.id;

    const query = `
      DELETE FROM public.data_savedfilter
      WHERE id = $1 AND user_id = $2
      RETURNING id, name
    `;

    const rows = await db.query(query, [filterId, userId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Filtre non trouvé' },
        { status: 404 }
      );
    }

    console.log('✅ [DELETE /api/saved-filters/[id]] Filter deleted:', {
      id: rows[0].id,
      name: rows[0].name,
    });

    return NextResponse.json(
      { message: 'Filtre supprimé avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ [DELETE /api/saved-filters/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du filtre' },
      { status: 500 }
    );
  }
}