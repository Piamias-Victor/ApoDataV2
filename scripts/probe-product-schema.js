
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

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
        console.log('--- Probing data_globalproduct ---');
        const res = await pool.query('SELECT * FROM data_globalproduct LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No rows found in data_globalproduct');
        } else {
            console.log('✅ data_globalproduct columns:', Object.keys(res.rows[0]));
            console.log('Sample row:', res.rows[0]);
        }
    } catch (error) {
        console.error('❌ Error probing schema:', error.message);
    } finally {
        await pool.end();
    }
}

probe();
