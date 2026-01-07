
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
        console.log('--- Checking ID_NAT uniqueness ---');
        const res = await pool.query('SELECT count(*) as total, count(distinct id_nat) as distinct_nat FROM data_pharmacy');
        console.log('Total rows:', res.rows[0].total);
        console.log('Distinct ID_NAT:', res.rows[0].distinct_nat);
        
        if (res.rows[0].total != res.rows[0].distinct_nat) {
            console.log('⚠️  ID_NAT is NOT unique!');
             const dups = await pool.query('SELECT id_nat, count(*) FROM data_pharmacy GROUP BY id_nat HAVING count(*) > 1 LIMIT 5');
             console.log('Duplicates:', dups.rows);
        } else {
            console.log('✅ ID_NAT is unique per row.');
        }

    } catch (error) {
        console.error('❌ Error probing schema:', error.message);
    } finally {
        await pool.end();
    }
}

probe();
