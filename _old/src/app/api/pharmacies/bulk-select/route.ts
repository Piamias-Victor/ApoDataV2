// src/app/api/pharmacies/bulk-select/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PharmacyBulkResult {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly ca: number;
  readonly area: string;
  readonly employees_count: number;
  readonly id_nat: string;
}

interface BulkSelectResponse {
  readonly pharmacies: PharmacyBulkResult[];
  readonly totalCount: number;
  readonly queryTime: number;
  readonly truncated: boolean;
}

/**
 * API Route - Récupération de TOUTES les pharmacies pour sélection massive
 * 
 * POST /api/pharmacies/bulk-select
 * Body: {} (vide - sélectionne tout)
 * 
 * Fonctionnalités :
 * - TOUTES les pharmacies de la base
 * - Optimisé pour performance (limit 10000 avec pagination)
 * - Admin uniquement pour sécurité
 * - Tri par CA descendant puis nom
 */
export async function POST() {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SÉCURITÉ : Admin uniquement pour "tout sélectionner"
    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required for bulk operations' 
      }, { status: 403 });
    }

    console.log('🚀 [API] Starting bulk pharmacy selection - ALL pharmacies');

    // Requête optimisée pour récupérer TOUTES les pharmacies
    const sqlQuery = `
      SELECT 
        id,
        name,
        address,
        ca,
        area,
        employees_count,
        id_nat
      FROM data_pharmacy
      WHERE 1=1
      ORDER BY ca DESC NULLS LAST, name ASC
      LIMIT 10000
    `;

    const pharmacies = await db.query<PharmacyBulkResult>(sqlQuery);
    const queryTime = Date.now() - startTime;

    // Comptage total pour vérifier si truncated
    const countQuery = `SELECT COUNT(*) as total FROM data_pharmacy`;
    const countResult = await db.query<{ total: string }>(countQuery);
    const totalCount = parseInt(countResult[0]?.total || '0', 10);
    const truncated = pharmacies.length >= 10000;

    console.log('✅ [API] Bulk pharmacy selection complete:', {
      returned: pharmacies.length,
      totalInDB: totalCount,
      truncated,
      queryTime: `${queryTime}ms`,
      performance: queryTime < 1000 ? '🚀 EXCELLENT' : queryTime < 3000 ? '✅ GOOD' : '⚠️ SLOW'
    });

    // Warning si base très importante
    if (totalCount > 10000) {
      console.warn(`⚠️ [API] Large pharmacy database: ${totalCount} total - returning first 10k`);
    }

    const response: BulkSelectResponse = {
      pharmacies,
      totalCount,
      queryTime,
      truncated
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Bulk pharmacy selection error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la sélection massive',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}