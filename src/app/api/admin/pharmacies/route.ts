import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, name, address } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'ID et Nom requis' }, { status: 400 });
        }

        // Update data_pharmacy
        const updateQuery = `
            UPDATE data_pharmacy
            SET name = $1, 
                address = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING id, name, address
        `;

        const result = await db.query(updateQuery, [name, address, id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 404 });
        }

        return NextResponse.json({ success: true, pharmacy: result.rows[0] });

    } catch (error) {
        console.error('Error updating pharmacy:', error);
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
}
