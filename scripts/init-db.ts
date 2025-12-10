// scripts/init-db.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/lib/db';

async function main() {
    console.log('🔄 Initializing database...');
    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS auth_password_resets (
        user_id UUID NOT NULL REFERENCES data_user(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id)
      );
    `);
        console.log('✅ Table auth_password_resets created/verified');
    } catch (err) {
        console.error('❌ Error initializing DB:', err);
    } finally {
        process.exit();
    }
}

main();
