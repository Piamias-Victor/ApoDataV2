import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user info
        const userResult = await db.query(
            'SELECT email, name FROM data_user WHERE id = $1',
            [params.id]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Generate new token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 86400000); // 24 hours

        // Update token in database
        await db.query(`
            UPDATE data_user 
            SET password_reset_token = $1, 
                password_reset_expires = $2
            WHERE id = $3
        `, [token, expiresAt, params.id]);

        // Send email
        if (process.env.SMTP_HOST) {
            await sendInvitationEmail(user.email, token, user.name);
        } else {
            console.log('📧 [DEV] Invitation for:', user.email, 'Token:', token);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resending invitation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
