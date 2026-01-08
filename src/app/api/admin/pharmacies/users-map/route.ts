import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.query(`
            SELECT 
                p.id as pharmacy_id,
                u.name as year_name
            FROM data_user u
            JOIN data_pharmacy p ON u.pharmacy_id = p.id
            WHERE u.deleted_at IS NULL AND u.role != 'admin'
            ORDER BY u.name
        `);

        // Group users by pharmacy ID
        const usersByPharmacy: Record<string, string[]> = {};
        
        result.rows.forEach(row => {
            if (!usersByPharmacy[row.pharmacy_id]) {
                usersByPharmacy[row.pharmacy_id] = [];
            }
            usersByPharmacy[row.pharmacy_id]!.push(row.year_name);
        });

        return NextResponse.json({ usersByPharmacy });
    } catch (error) {
        console.error('Error fetching users map:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
