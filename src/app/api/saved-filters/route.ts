// src/app/api/saved-filters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SavedFilter, SaveFilterPayload } from '@/types/savedFilters';

/**
 * GET /api/saved-filters
 * Récupère tous les filtres sauvegardés de l'utilisateur connecté
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
    const pharmacyId = session.user.pharmacyId;
    const isAdmin = session.user.role === 'admin';

    // Admin : récupère tous ses filtres sans restriction pharmacy
    // User : doit avoir une pharmacyId
    if (!isAdmin && !pharmacyId) {
      return NextResponse.json(
        { error: 'Pharmacie non définie' },
        { status: 400 }
      );
    }

    // Query avec ou sans filtre pharmacy selon le rôle
    const query = isAdmin
      ? `
        SELECT 
          id,
          user_id,
          pharmacy_id,
          name,
          product_codes,
          laboratory_names,
          category_names,
          category_types,
          created_at,
          updated_at
        FROM public.data_savedfilter
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `
      : `
        SELECT 
          id,
          user_id,
          pharmacy_id,
          name,
          product_codes,
          laboratory_names,
          category_names,
          category_types,
          created_at,
          updated_at
        FROM public.data_savedfilter
        WHERE user_id = $1 AND pharmacy_id = $2
        ORDER BY updated_at DESC
      `;

    const params = isAdmin ? [userId] : [userId, pharmacyId];
    const rows = await db.query(query, params);

    const filters: SavedFilter[] = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      pharmacy_id: row.pharmacy_id,
      name: row.name,
      product_codes: row.product_codes || [],
      laboratory_names: row.laboratory_names || [],
      category_names: row.category_names || [],
      category_types: row.category_types || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

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
 * Crée un nouveau filtre sauvegardé
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
    const pharmacyId = session.user.pharmacyId || null; // NULL si pas de pharmacy
    const isAdmin = session.user.role === 'admin';

    // User (non-admin) doit avoir une pharmacyId
    if (!isAdmin && !pharmacyId) {
      return NextResponse.json(
        { error: 'Pharmacie non définie' },
        { status: 400 }
      );
    }

    const body: SaveFilterPayload = await request.json();

    // Validation
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

    // Vérifier qu'il y a au moins une sélection
    const hasSelection = 
      (body.product_codes?.length > 0) ||
      (body.laboratory_names?.length > 0) ||
      (body.category_names?.length > 0);

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
        pharmacy_id,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING 
        id,
        user_id,
        pharmacy_id,
        name,
        product_codes,
        laboratory_names,
        category_names,
        category_types,
        created_at,
        updated_at
    `;

    // Trim tous les noms avant sauvegarde
    const trimmedLabNames = (body.laboratory_names || []).map(name => name.trim());
    const trimmedCatNames = (body.category_names || []).map(name => name.trim());

    const rows = await db.query(query, [
      userId,
      pharmacyId,
      body.name.trim(),
      body.product_codes || [],
      trimmedLabNames,
      trimmedCatNames,
      body.category_types || [],
    ]);

    const savedFilter: SavedFilter = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      pharmacy_id: rows[0].pharmacy_id,
      name: rows[0].name,
      product_codes: rows[0].product_codes || [],
      laboratory_names: rows[0].laboratory_names || [],
      category_names: rows[0].category_names || [],
      category_types: rows[0].category_types || [],
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    };

    console.log('✅ [POST /api/saved-filters] Filter created:', {
      id: savedFilter.id,
      name: savedFilter.name,
      products: savedFilter.product_codes.length,
      laboratories: savedFilter.laboratory_names.length,
      categories: savedFilter.category_names.length,
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