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
        console.log('🔍 Fetching ONE random match to check validity...');
        
        // Fetch a sale that successfully joins with inventory on the incorrect condition
        const query = `
            SELECT 
                s.product_id as sale_product_internal_id,
                inv.id as snapshot_id,
                inv.product_id as snapshot_product_uuid
            FROM data_sales s
            JOIN data_inventorysnapshot inv ON s.product_id = inv.id
            LIMIT 1;
        `;
        
        const res = await pool.query(query);
        
        if (res.rows.length === 0) {
            console.log('No matches found (Unexpected!).');
            return;
        }

        const match = res.rows[0];
        console.log('\n=== Mismatch Evidence ===');
        console.log(`1. Sale Product ID (Internal): ${match.sale_product_internal_id}`);
        console.log(`2. Joined Snapshot ID (PK): ${match.snapshot_id}`);
        console.log('   (They match because of the JOIN ON s.product_id = inv.id)');
        console.log(`3. BUT... Snapshot ID ${match.snapshot_id} belongs to Product UUID: ${match.snapshot_product_uuid}`);

        // Resolve the names
        console.log('\n...Resolving Product Names...');

        // Name of the sold product
        const soldProductRes = await pool.query('SELECT name FROM data_internalproduct WHERE internal_id = $1', [match.sale_product_internal_id]);
        const soldProductName = soldProductRes.rows[0]?.name || 'Unknown';

        // Name of the product the snapshot belongs to
        const snapshotProductRes = await pool.query('SELECT name FROM data_internalproduct WHERE id = $1', [match.snapshot_product_uuid]);
        const snapshotProductName = snapshotProductRes.rows[0]?.name || 'Unknown';

        console.log(`\n❌ CONFLICT:`);
        console.log(`- You SOLD: "${soldProductName}" (ID: ${match.sale_product_internal_id})`);
        console.log(`- You Linked it to Stock of: "${snapshotProductName}" (Snapshot ID: ${match.snapshot_id})`);
        
        if (soldProductName !== snapshotProductName) {
            console.log('\n🚨 PROOF: The products are DIFFERENT! The join is invalid.');
        } else {
            console.log('\n⚠️ Coincidence! They are the same product (Rare). Try running again.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
