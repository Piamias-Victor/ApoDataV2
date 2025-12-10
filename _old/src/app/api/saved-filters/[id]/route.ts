// src/app/api/saved-filters/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { 
  SavedFilter,
  ClassicSavedFilter,
  GenericSavedFilter,
  LoadClassicFilterResult,
  LoadGenericFilterResult,
  RenameFilterPayload
} from '@/types/savedFilters';

/**
 * GET /api/saved-filters/[id]
 * Récupère un filtre + résout les données selon le type
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

    const filterQuery = `
      SELECT 
        id, user_id, filter_type, name, pharmacy_ids, excluded_product_codes,
        analysis_date_start, analysis_date_end, comparison_date_start, comparison_date_end,
        product_codes, laboratory_names, category_names, category_types,
        generic_groups, generic_products, generic_laboratories, price_filters,
        tva_rates, generic_status, show_global_top,
        created_at, updated_at
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

    const row = filterRows[0];

    // Résoudre les pharmacies (commun aux deux types)
    const resolvedPharmacies: LoadClassicFilterResult['resolvedPharmacies'] = [];

    if (row.pharmacy_ids && row.pharmacy_ids.length > 0) {
      const pharmacyQuery = `
        SELECT id, name, address, ca, area, employees_count, id_nat
        FROM public.data_pharmacy
        WHERE id = ANY($1::uuid[])
      `;

      const pharmacyRows = await db.query(pharmacyQuery, [row.pharmacy_ids]);

      for (const pRow of pharmacyRows) {
        resolvedPharmacies.push({
          id: pRow.id,
          name: pRow.name || 'Pharmacie inconnue',
          address: pRow.address || 'Adresse non disponible',
          ca: pRow.ca ? parseFloat(pRow.ca.toString()) : 0,
          area: pRow.area || 'Zone non définie',
          employees_count: pRow.employees_count ? parseInt(pRow.employees_count.toString()) : 0,
          id_nat: pRow.id_nat || '',
        });
      }
    }

    if (row.filter_type === 'classic') {
      // === FILTRE CLASSIQUE ===
      
      const filter: ClassicSavedFilter = {
        id: row.id,
        user_id: row.user_id,
        filter_type: 'classic',
        name: row.name,
        pharmacy_ids: row.pharmacy_ids || [],
        excluded_product_codes: row.excluded_product_codes || [],
        analysis_date_start: row.analysis_date_start,
        analysis_date_end: row.analysis_date_end,
        comparison_date_start: row.comparison_date_start,
        comparison_date_end: row.comparison_date_end,
        product_codes: row.product_codes || [],
        laboratory_names: row.laboratory_names || [],
        category_names: row.category_names || [],
        category_types: row.category_types || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      // Résoudre laboratoires
      const resolvedLaboratories: LoadClassicFilterResult['resolvedLaboratories'] = [];
      
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

        for (const lRow of labRows) {
          resolvedLaboratories.push({
            name: lRow.laboratory_name,
            productCodes: lRow.product_codes || [],
            productCount: parseInt(lRow.product_count) || 0,
          });
        }
      }

      // Résoudre catégories
      const resolvedCategories: LoadClassicFilterResult['resolvedCategories'] = [];
      
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

      // Agréger tous les codes produits
      const allProductCodes = new Set<string>(filter.product_codes);

      resolvedLaboratories.forEach(lab => {
        lab.productCodes.forEach(code => allProductCodes.add(code));
      });

      resolvedCategories.forEach(cat => {
        cat.productCodes.forEach(code => allProductCodes.add(code));
      });

      const result: LoadClassicFilterResult = {
        filter,
        resolvedProductCodes: Array.from(allProductCodes),
        resolvedLaboratories,
        resolvedCategories,
        resolvedPharmacies,
      };

      console.log('✅ [GET /api/saved-filters/[id]] Classic filter loaded:', {
        id: filter.id,
        name: filter.name,
        totalProducts: result.resolvedProductCodes.length,
      });

      return NextResponse.json(result, { status: 200 });

    } else {
      // === FILTRE GÉNÉRIQUE ===
      
      const filter: GenericSavedFilter = {
        id: row.id,
        user_id: row.user_id,
        filter_type: 'generic',
        name: row.name,
        pharmacy_ids: row.pharmacy_ids || [],
        excluded_product_codes: row.excluded_product_codes || [],
        analysis_date_start: row.analysis_date_start,
        analysis_date_end: row.analysis_date_end,
        comparison_date_start: row.comparison_date_start,
        comparison_date_end: row.comparison_date_end,
        generic_groups: row.generic_groups || [],
        generic_products: row.generic_products || [],
        generic_laboratories: row.generic_laboratories || [],
        price_filters: row.price_filters || {
          prixFabricant: { min: null, max: null },
          prixNetRemise: { min: null, max: null },
          remise: { min: null, max: null }
        },
        tva_rates: row.tva_rates || [],
        generic_status: row.generic_status || 'BOTH',
        show_global_top: row.show_global_top || false,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      const result: LoadGenericFilterResult = {
        filter,
        resolvedPharmacies,
      };

      console.log('✅ [GET /api/saved-filters/[id]] Generic filter loaded:', {
        id: filter.id,
        name: filter.name,
        groups: filter.generic_groups.length,
        products: filter.generic_products.length,
        laboratories: filter.generic_laboratories.length,
      });

      return NextResponse.json(result, { status: 200 });
    }

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
 * Renomme un filtre
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

    const query = `
      UPDATE public.data_savedfilter
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING 
        id, user_id, filter_type, name, pharmacy_ids, excluded_product_codes,
        analysis_date_start, analysis_date_end, comparison_date_start, comparison_date_end,
        product_codes, laboratory_names, category_names, category_types,
        generic_groups, generic_products, generic_laboratories, price_filters,
        tva_rates, generic_status, show_global_top,
        created_at, updated_at
    `;

    const rows = await db.query(query, [body.name.trim(), filterId, userId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Filtre non trouvé' },
        { status: 404 }
      );
    }

    const row = rows[0];

    let updatedFilter: SavedFilter;

    if (row.filter_type === 'classic') {
      updatedFilter = {
        id: row.id,
        user_id: row.user_id,
        filter_type: 'classic',
        name: row.name,
        pharmacy_ids: row.pharmacy_ids || [],
        excluded_product_codes: row.excluded_product_codes || [],
        analysis_date_start: row.analysis_date_start,
        analysis_date_end: row.analysis_date_end,
        comparison_date_start: row.comparison_date_start,
        comparison_date_end: row.comparison_date_end,
        product_codes: row.product_codes || [],
        laboratory_names: row.laboratory_names || [],
        category_names: row.category_names || [],
        category_types: row.category_types || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as ClassicSavedFilter;
    } else {
      updatedFilter = {
        id: row.id,
        user_id: row.user_id,
        filter_type: 'generic',
        name: row.name,
        pharmacy_ids: row.pharmacy_ids || [],
        excluded_product_codes: row.excluded_product_codes || [],
        analysis_date_start: row.analysis_date_start,
        analysis_date_end: row.analysis_date_end,
        comparison_date_start: row.comparison_date_start,
        comparison_date_end: row.comparison_date_end,
        generic_groups: row.generic_groups || [],
        generic_products: row.generic_products || [],
        generic_laboratories: row.generic_laboratories || [],
        price_filters: row.price_filters,
        tva_rates: row.tva_rates || [],
        generic_status: row.generic_status,
        show_global_top: row.show_global_top,
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as GenericSavedFilter;
    }

    console.log('✅ [PATCH /api/saved-filters/[id]] Filter renamed:', {
      id: updatedFilter.id,
      name: updatedFilter.name,
      type: updatedFilter.filter_type,
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
 * Supprime un filtre
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
      RETURNING id, name, filter_type
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
      type: rows[0].filter_type,
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