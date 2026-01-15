import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const res = await pool.query(`
            SELECT pid, state, query, now() - query_start as duration 
            FROM pg_stat_activity 
            WHERE state = 'active' 
            AND query NOT ILIKE '%pg_stat_activity%'
        `);
        
        console.log("\n--- Active Database Queries ---");
        res.rows.forEach(r => {
            console.log(`[${r.duration?.seconds ? r.duration.seconds + 's' : r.duration}] ${r.query.substring(0, 100)}...`);
        });
        
        // Also check if mv_sales_enriched exists yet
        const checkView = await pool.query(`
            SELECT count(*) FROM pg_matviews WHERE matviewname = 'mv_sales_enriched';
        `);
        console.log(`\nView 'mv_sales_enriched' exists: ${checkView.rows[0].count > 0 ? 'YES' : 'NO'}`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
