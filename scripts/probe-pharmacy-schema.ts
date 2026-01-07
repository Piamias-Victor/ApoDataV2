
require('dotenv').config({ path: '.env.local' });
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function probe() {
    try {
        console.log('--- Probing data_pharmacy ---');
        const res = await pool.query('SELECT * FROM data_pharmacy LIMIT 5');
        if (res.rows.length === 0) {
            console.log('No rows found in data_pharmacy');
        } else {
            console.log('✅ data_pharmacy columns:', Object.keys(res.rows[0]));
            // Print a sample to check ID format
            console.log('Sample row:', res.rows[0]);
        }
    } catch (error) {
        console.error('❌ Error probing schema:', (error as any).message);
    } finally {
        await pool.end();
    }
}

probe();
