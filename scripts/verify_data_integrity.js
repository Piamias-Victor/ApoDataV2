const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // 1. Check if InventorySnapshot has duplicates for a single product
        // If it's a history table, we expect many rows per product_id (UUID).
        const historyCheck = await pool.query(`
            SELECT product_id, COUNT(*) 
            FROM data_inventorysnapshot 
            GROUP BY product_id 
            HAVING COUNT(*) > 1 
            LIMIT 5;
        `);
        console.log('\n=== Is InventorySnapshot a History Table? ===');
        if (historyCheck.rows.length > 0) {
            console.log('YES. Found products with multiple snapshots:', historyCheck.rows);
        } else {
            console.log('NO. It seems unique per product (Current Stock?).');
        }

        // 2. Check overlap between Sales.product_id and InventorySnapshot.id
        // The problematic JOIN: s.product_id = inv.id
        const joinCheck = await pool.query(`
            SELECT COUNT(*) as matches
            FROM data_sales s
            JOIN data_inventorysnapshot inv ON s.product_id = inv.id
            LIMIT 1000;
        `);
        console.log('\n=== Testing user\'s logic (s.product_id = inv.id) ===');
        console.log('Matches found (LIMIT 1000):', joinCheck.rows[0].matches);

        // 3. Check what s.product_id actually corresponds to in InternalProduct
        const foreignKeyCheck = await pool.query(`
            SELECT COUNT(*) as matches
            FROM data_sales s
            JOIN data_internalproduct ip ON s.product_id = ip.internal_id
            LIMIT 1000;
        `);
        console.log('\n=== Testing standard logic (s.product_id = ip.internal_id) ===');
        console.log('Matches found (LIMIT 1000):', foreignKeyCheck.rows[0].matches);

        // 4. Sample Data inspection
        const sampleSale = await pool.query('SELECT product_id FROM data_sales LIMIT 1');
        if (sampleSale.rows.length > 0) {
            const pid = sampleSale.rows[0].product_id;
            console.log(`\nSample Sale product_id (BigInt): ${pid}`);
            
            // Look for this ID in inv.id
            const invById = await pool.query('SELECT * FROM data_inventorysnapshot WHERE id = $1', [pid]);
            console.log(`Inventory lookup by ID=${pid}:`, invById.rows.length > 0 ? 'FOUND' : 'NOT FOUND');

            // Look for this ID in ip.internal_id
            const ipById = await pool.query('SELECT * FROM data_internalproduct WHERE internal_id = $1', [pid]);
            console.log(`InternalProduct lookup by internal_id=${pid}:`, ipById.rows.length > 0 ? 'FOUND' : 'NOT FOUND');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
