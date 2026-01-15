import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("Searching for 'Croix d''Or' pharmacies...");

        // 1. Find Pharmacies (Broad search)
        const pharmacies = await pool.query(`
            SELECT id, name, id_nat 
            FROM data_pharmacy 
            WHERE name ILIKE '%Croix%'
            LIMIT 50
        `);

        if (pharmacies.rows.length === 0) {
            console.log("No pharmacies found.");
            return;
        }

        console.log(`Found ${pharmacies.rows.length} pharmacies.`);

        // 2. Analyzes dates for each
        for (const ph of pharmacies.rows) {
            console.log(`\nAnalyzing Pharmacy: ${ph.name} (ID: ${ph.id})`);
            
            // Check Sales (using mv_sales_enriched which definitely has pharmacy_id and sale_date)
            try {
                const sales = await pool.query(`
                    SELECT MIN(sale_date) as start_date, MAX(sale_date) as end_date, COUNT(*) as count 
                    FROM mv_sales_enriched 
                    WHERE pharmacy_id = $1
                `, [ph.id]);

                const s = sales.rows[0];
                console.log(`  - Sales (MV): ${s.count} records. Range: ${s.start_date ? s.start_date.toISOString().split('T')[0] : 'N/A'} to ${s.end_date ? s.end_date.toISOString().split('T')[0] : 'N/A'}`);
            } catch (err: any) {
                console.error('  - Error querying mv_sales_enriched:', err.message);
            }

             // Check Purchases (Orders) - Debug columns first
             const sampleOrder = await pool.query(`SELECT * FROM data_order LIMIT 1`);
             if (sampleOrder.rows.length > 0) {
                 // console.log('Columns in data_order:', Object.keys(sampleOrder.rows[0]));
             }

             try {
                const orders = await pool.query(`
                    SELECT MIN(delivery_date) as start_date, MAX(delivery_date) as end_date, COUNT(*) as count 
                    FROM data_order
                    WHERE pharmacy_id = $1
                `, [ph.id]);

                const o = orders.rows[0];
                console.log(`  - Orders: ${o.count} records. Range: ${o.start_date ? o.start_date.toISOString().split('T')[0] : 'N/A'} to ${o.end_date ? o.end_date.toISOString().split('T')[0] : 'N/A'}`);
             } catch (err: any) {
                 console.error('  - Error querying data_order:', err.message);
             }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
