// src/app/api/saved-filters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SavedFilter, SaveFilterPayload } from '@/types/savedFilters';

/**
 * GET /api/saved-filters
 * Récupère tous les filtres sauvegardés de l'utilisateur connecté - AVEC EXCLUSIONS
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const query = `
      SELECT 
        id,
        user_id,
        pharmacy_ids,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        excluded_product_codes,
        analysis_date_start,
        analysis_date_end,
        comparison_date_start,
        comparison_date_end,
        created_at,
        updated_at
      FROM public.data_savedfilter
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;

    const rows = await db.query(query, [userId]);

    const filters: SavedFilter[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      pharmacy_ids: row.pharmacy_ids || [],
      name: row.name,
      product_codes: row.product_codes || [],
      laboratory_names: row.laboratory_names || [],
      category_names: row.category_names || [],
      category_types: row.category_types || [],
      excluded_product_codes: row.excluded_product_codes || [], // 🔥 NOUVEAU
      analysis_date_start: row.analysis_date_start,
      analysis_date_end: row.analysis_date_end,
      comparison_date_start: row.comparison_date_start,
      comparison_date_end: row.comparison_date_end,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    console.log('✅ [GET /api/saved-filters] Loaded:', {
      userId,
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
 * Crée un nouveau filtre sauvegardé - AVEC EXCLUSIONS
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

    // Validation nom
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

    // Validation dates obligatoires
    if (!body.analysis_date_start || !body.analysis_date_end) {
      return NextResponse.json(
        { error: 'Les dates d\'analyse sont obligatoires' },
        { status: 400 }
      );
    }

    // Validation cohérence dates
    if (new Date(body.analysis_date_start) > new Date(body.analysis_date_end)) {
      return NextResponse.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    // Validation dates comparaison (si présentes)
    if (body.comparison_date_start && body.comparison_date_end) {
      if (new Date(body.comparison_date_start) > new Date(body.comparison_date_end)) {
        return NextResponse.json(
          { error: 'Les dates de comparaison sont invalides' },
          { status: 400 }
        );
      }
    }

    // Vérifier qu'il y a au moins une sélection
    const hasSelection = 
      (body.product_codes?.length > 0) ||
      (body.laboratory_names?.length > 0) ||
      (body.category_names?.length > 0) ||
      (body.pharmacy_ids?.length > 0);

    if (!hasSelection) {
      return NextResponse.json(
        { error: 'Aucune sélection à sauvegarder' },
        { status: 400 }
      );
    }

    // Vérifier que category_names et category_types ont la même longueur
    if (body.category_names.length !== body.category_types.length) {
      return NextResponse.json(
        { error: 'Données catégories invalides' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO public.data_savedfilter (
        user_id,
        pharmacy_ids,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        excluded_product_codes,
        analysis_date_start,
        analysis_date_end,
        comparison_date_start,
        comparison_date_end,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING 
        id,
        user_id,
        pharmacy_ids,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        excluded_product_codes,
        analysis_date_start,
        analysis_date_end,
        comparison_date_start,
        comparison_date_end,
        created_at,
        updated_at
    `;

    // Trim tous les noms avant sauvegarde
    const trimmedLabNames = (body.laboratory_names || []).map(name => name.trim());
    const trimmedCatNames = (body.category_names || []).map(name => name.trim());

    const rows = await db.query(query, [
      userId,
      body.pharmacy_ids || [],
      body.name.trim(),
      body.product_codes || [],
      trimmedLabNames,
      trimmedCatNames,
      body.category_types || [],
      body.excluded_product_codes || [], // 🔥 NOUVEAU
      body.analysis_date_start,
      body.analysis_date_end,
      body.comparison_date_start || null,
      body.comparison_date_end || null,
    ]);

    const savedFilter: SavedFilter = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      pharmacy_ids: rows[0].pharmacy_ids || [],
      name: rows[0].name,
      product_codes: rows[0].product_codes || [],
      laboratory_names: rows[0].laboratory_names || [],
      category_names: rows[0].category_names || [],
      category_types: rows[0].category_types || [],
      excluded_product_codes: rows[0].excluded_product_codes || [], // 🔥 NOUVEAU
      analysis_date_start: rows[0].analysis_date_start,
      analysis_date_end: rows[0].analysis_date_end,
      comparison_date_start: rows[0].comparison_date_start,
      comparison_date_end: rows[0].comparison_date_end,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    };

    console.log('✅ [POST /api/saved-filters] Filter created with exclusions:', {
      id: savedFilter.id,
      name: savedFilter.name,
      products: savedFilter.product_codes.length,
      laboratories: savedFilter.laboratory_names.length,
      categories: savedFilter.category_names.length,
      pharmacies: savedFilter.pharmacy_ids.length,
      exclusions: savedFilter.excluded_product_codes?.length || 0, // 🔥 NOUVEAU
      dates: `${savedFilter.analysis_date_start} → ${savedFilter.analysis_date_end}`,
      hasComparison: !!(savedFilter.comparison_date_start && savedFilter.comparison_date_end),
    });

    return NextResponse.json({ filter: savedFilter }, { status: 201 });

  } catch (error) {
    console.error('❌ [POST /api/saved-filters] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du filtre' },
      { status: 500 }
    );
  }
}