// src/app/api/saved-filters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { 
  SavedFilter, 
  ClassicSavedFilter,
  GenericSavedFilter,
  SaveFilterPayload,
  SaveClassicFilterPayload,
  SaveGenericFilterPayload
} from '@/types/savedFilters';

/**
 * GET /api/saved-filters
 * Récupère tous les filtres sauvegardés (classiques + génériques)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Récupérer le filter_type depuis les query params (optionnel)
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filter_type') as 'classic' | 'generic' | null;

    let query = `
      SELECT 
        id, user_id, filter_type, name, pharmacy_ids, excluded_product_codes,
        analysis_date_start, analysis_date_end, comparison_date_start, comparison_date_end,
        product_codes, laboratory_names, category_names, category_types,
        generic_groups, generic_products, generic_laboratories, price_filters,
        tva_rates, generic_status, show_global_top,
        created_at, updated_at
      FROM public.data_savedfilter
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (filterType) {
      query += ` AND filter_type = $2`;
      params.push(filterType);
    }

    query += ` ORDER BY updated_at DESC`;

    const rows = await db.query(query, params);

    const filters: SavedFilter[] = rows.map(row => {
      const base = {
        id: row.id,
        user_id: row.user_id,
        filter_type: row.filter_type,
        name: row.name,
        pharmacy_ids: row.pharmacy_ids || [],
        excluded_product_codes: row.excluded_product_codes || [],
        analysis_date_start: row.analysis_date_start,
        analysis_date_end: row.analysis_date_end,
        comparison_date_start: row.comparison_date_start,
        comparison_date_end: row.comparison_date_end,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      if (row.filter_type === 'classic') {
        return {
          ...base,
          filter_type: 'classic' as const,
          product_codes: row.product_codes || [],
          laboratory_names: row.laboratory_names || [],
          category_names: row.category_names || [],
          category_types: row.category_types || [],
        } as ClassicSavedFilter;
      } else {
        return {
          ...base,
          filter_type: 'generic' as const,
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
        } as GenericSavedFilter;
      }
    });

    console.log('✅ [GET /api/saved-filters] Loaded:', {
      userId,
      filterType: filterType || 'all',
      count: filters.length,
    });

    return NextResponse.json({ filters }, { status: 200 });

  } catch (error) {
    console.error('❌ [GET /api/saved-filters] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des filtres' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved-filters
 * Crée un nouveau filtre (classique OU générique)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: SaveFilterPayload = await request.json();

    // Validation commune
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

    if (!body.analysis_date_start || !body.analysis_date_end) {
      return NextResponse.json(
        { error: 'Les dates d\'analyse sont obligatoires' },
        { status: 400 }
      );
    }

    if (new Date(body.analysis_date_start) > new Date(body.analysis_date_end)) {
      return NextResponse.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    if (body.comparison_date_start && body.comparison_date_end) {
      if (new Date(body.comparison_date_start) > new Date(body.comparison_date_end)) {
        return NextResponse.json(
          { error: 'Les dates de comparaison sont invalides' },
          { status: 400 }
        );
      }
    }

    // Validation spécifique selon le type
    if (body.filter_type === 'classic') {
      const classicBody = body as SaveClassicFilterPayload;
      
      const hasSelection = 
        (classicBody.product_codes?.length > 0) ||
        (classicBody.laboratory_names?.length > 0) ||
        (classicBody.category_names?.length > 0) ||
        (classicBody.pharmacy_ids?.length > 0);

      if (!hasSelection) {
        return NextResponse.json(
          { error: 'Aucune sélection à sauvegarder' },
          { status: 400 }
        );
      }

      if (classicBody.category_names.length !== classicBody.category_types.length) {
        return NextResponse.json(
          { error: 'Données catégories invalides' },
          { status: 400 }
        );
      }

      const query = `
        INSERT INTO public.data_savedfilter (
          user_id, filter_type, name, pharmacy_ids, excluded_product_codes,
          analysis_date_start, analysis_date_end, comparison_date_start, comparison_date_end,
          product_codes, laboratory_names, category_names, category_types,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `;

      const trimmedLabNames = classicBody.laboratory_names.map(name => name.trim());
      const trimmedCatNames = classicBody.category_names.map(name => name.trim());

      const rows = await db.query(query, [
        userId,
        'classic',
        classicBody.name.trim(),
        classicBody.pharmacy_ids || [],
        classicBody.excluded_product_codes || [],
        classicBody.analysis_date_start,
        classicBody.analysis_date_end,
        classicBody.comparison_date_start || null,
        classicBody.comparison_date_end || null,
        classicBody.product_codes || [],
        trimmedLabNames,
        trimmedCatNames,
        classicBody.category_types || [],
      ]);

      const savedFilter: ClassicSavedFilter = {
        id: rows[0].id,
        user_id: rows[0].user_id,
        filter_type: 'classic',
        name: rows[0].name,
        pharmacy_ids: rows[0].pharmacy_ids || [],
        excluded_product_codes: rows[0].excluded_product_codes || [],
        analysis_date_start: rows[0].analysis_date_start,
        analysis_date_end: rows[0].analysis_date_end,
        comparison_date_start: rows[0].comparison_date_start,
        comparison_date_end: rows[0].comparison_date_end,
        product_codes: rows[0].product_codes || [],
        laboratory_names: rows[0].laboratory_names || [],
        category_names: rows[0].category_names || [],
        category_types: rows[0].category_types || [],
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
      };

      console.log('✅ [POST /api/saved-filters] Classic filter created:', {
        id: savedFilter.id,
        name: savedFilter.name,
        products: savedFilter.product_codes.length,
        laboratories: savedFilter.laboratory_names.length,
        categories: savedFilter.category_names.length,
        pharmacies: savedFilter.pharmacy_ids.length,
        exclusions: savedFilter.excluded_product_codes.length,
      });

      return NextResponse.json({ filter: savedFilter }, { status: 201 });

    } else {
      const genericBody = body as SaveGenericFilterPayload;

      const hasSelection =
        (genericBody.generic_groups?.length > 0) ||
        (genericBody.generic_products?.length > 0) ||
        (genericBody.generic_laboratories?.length > 0);

      if (!hasSelection) {
        return NextResponse.json(
          { error: 'Aucune sélection à sauvegarder' },
          { status: 400 }
        );
      }

      const query = `
        INSERT INTO public.data_savedfilter (
          user_id, filter_type, name, pharmacy_ids, excluded_product_codes,
          analysis_date_start, analysis_date_end, comparison_date_start, comparison_date_end,
          generic_groups, generic_products, generic_laboratories, price_filters,
          tva_rates, generic_status, show_global_top,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *
      `;

      const rows = await db.query(query, [
        userId,
        'generic',
        genericBody.name.trim(),
        genericBody.pharmacy_ids || [],
        genericBody.excluded_product_codes || [],
        genericBody.analysis_date_start,
        genericBody.analysis_date_end,
        genericBody.comparison_date_start || null,
        genericBody.comparison_date_end || null,
        JSON.stringify(genericBody.generic_groups || []),
        JSON.stringify(genericBody.generic_products || []),
        JSON.stringify(genericBody.generic_laboratories || []),
        JSON.stringify(genericBody.price_filters || {
          prixFabricant: { min: null, max: null },
          prixNetRemise: { min: null, max: null },
          remise: { min: null, max: null }
        }),
        genericBody.tva_rates || [],
        genericBody.generic_status || 'BOTH',
        genericBody.show_global_top || false,
      ]);

      const savedFilter: GenericSavedFilter = {
        id: rows[0].id,
        user_id: rows[0].user_id,
        filter_type: 'generic',
        name: rows[0].name,
        pharmacy_ids: rows[0].pharmacy_ids || [],
        excluded_product_codes: rows[0].excluded_product_codes || [],
        analysis_date_start: rows[0].analysis_date_start,
        analysis_date_end: rows[0].analysis_date_end,
        comparison_date_start: rows[0].comparison_date_start,
        comparison_date_end: rows[0].comparison_date_end,
        generic_groups: rows[0].generic_groups || [],
        generic_products: rows[0].generic_products || [],
        generic_laboratories: rows[0].generic_laboratories || [],
        price_filters: rows[0].price_filters,
        tva_rates: rows[0].tva_rates || [],
        generic_status: rows[0].generic_status,
        show_global_top: rows[0].show_global_top,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
      };

      console.log('✅ [POST /api/saved-filters] Generic filter created:', {
        id: savedFilter.id,
        name: savedFilter.name,
        groups: savedFilter.generic_groups.length,
        products: savedFilter.generic_products.length,
        laboratories: savedFilter.generic_laboratories.length,
        pharmacies: savedFilter.pharmacy_ids.length,
        exclusions: savedFilter.excluded_product_codes.length,
      });

      return NextResponse.json({ filter: savedFilter }, { status: 201 });
    }

  } catch (error) {
    console.error('❌ [POST /api/saved-filters] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du filtre' },
      { status: 500 }
    );
  }
}