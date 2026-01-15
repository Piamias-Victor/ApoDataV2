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

const SEARCH_TERMS = ['Croix', 'Centre', 'Brignoles', 'Cadran'];

async function main() {
    try {
        console.log("Searching for pharmacies...");

        for (const term of SEARCH_TERMS) {
            console.log(`\n--- Searching for '${term}' ---`);
            const pharmacies = await pool.query(`
                SELECT id, name, id_nat 
                FROM data_pharmacy 
                WHERE name ILIKE $1
            `, [`%${term}%`]);

            if (pharmacies.rows.length === 0) {
                console.log("No pharmacies found.");
                continue;
            }

            for (const ph of pharmacies.rows) {
                console.log(`\nAnalyzing: ${ph.name} (${ph.id})`);
                
                try {
                    const sales = await pool.query(`
                        SELECT MIN(sale_date) as start_date, MAX(sale_date) as end_date, COUNT(*) as count 
                        FROM mv_sales_enriched 
                        WHERE pharmacy_id = $1
                    `, [ph.id]);

                    const s = sales.rows[0];
                    console.log(`  [Ventes]   ${s.count.toString().padStart(7)} records | ${s.start_date ? s.start_date.toISOString().split('T')[0] : 'N/A'} -> ${s.end_date ? s.end_date.toISOString().split('T')[0] : 'N/A'}`);
                } catch (err: any) {
                    console.error('  Error querying sales:', err.message);
                }

                 try {
                    const orders = await pool.query(`
                        SELECT MIN(delivery_date) as start_date, MAX(delivery_date) as end_date, COUNT(*) as count 
                        FROM data_order
                        WHERE pharmacy_id = $1
                    `, [ph.id]);

                    const o = orders.rows[0];
                    console.log(`  [Commandes]${o.count.toString().padStart(7)} records | ${o.start_date ? o.start_date.toISOString().split('T')[0] : 'N/A'} -> ${o.end_date ? o.end_date.toISOString().split('T')[0] : 'N/A'}`);
                 } catch (err: any) {
                     console.error('  Error querying orders:', err.message);
                 }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
