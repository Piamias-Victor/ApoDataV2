const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspectTable(tableName) {
    const res = await pool.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`\n=== Table: ${tableName} ===`);
    if (res.rows.length === 0) {
        console.log('(Table not found)');
    } else {
        res.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (${row.udt_name})`);
        });
    }
}

async function main() {
    try {
        await inspectTable('data_sales');
        await inspectTable('data_inventorysnapshot');
        await inspectTable('data_internalproduct'); // Also check this one
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
