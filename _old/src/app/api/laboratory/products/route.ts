// src/app/api/laboratory/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/laboratory/products
 * Récupère les codes produits d'un laboratoire spécifique
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

        const { searchParams } = new URL(request.url);
        const laboratoryName = searchParams.get('name');

        if (!laboratoryName) {
            return NextResponse.json(
                { error: 'Nom du laboratoire requis' },
                { status: 400 }
            );
        }

        console.log('🔍 [API Laboratory Products] Fetching products for:', laboratoryName);

        // Récupérer tous les codes produits pour ce laboratoire
        const result = await db.query<{ code_13_ref: string }>(
            `
      SELECT DISTINCT gp.code_13_ref
      FROM data_globalproduct gp
      WHERE gp.bcb_lab = $1
        AND gp.code_13_ref IS NOT NULL
      ORDER BY gp.code_13_ref
      `,
            [laboratoryName]
        );

        const productCodes = result.map((row: { code_13_ref: string }) => row.code_13_ref);

        console.log('✅ [API Laboratory Products] Found:', {
            laboratory: laboratoryName,
            productCount: productCodes.length
        });

        return NextResponse.json({
            laboratoryName,
            productCodes,
            productCount: productCodes.length
        });

    } catch (error) {
        console.error('❌ [API Laboratory Products] Error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
