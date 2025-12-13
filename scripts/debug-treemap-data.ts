import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkData() {
    const { db } = await import('../src/lib/db');
    try {
        console.log('--- Checking MV Columns ---');
        // Check if columns exist and have data
        const checkQuery = `
            SELECT 
                COUNT(*) as total_rows,
                COUNT(cat_l0) as l0_count,
                COUNT(cat_l1) as l1_count,
                COUNT(category_name) as cat_name_count,
                SUM(montant_ht) as total_ht
            FROM mv_sales_enriched
        `;
        const res = await db.query(checkQuery);
        console.log('MV Stats:', res.rows[0]);

        console.log('\n--- Sample Data (L0) ---');
        const sampleQuery = `
            SELECT cat_l0, SUM(montant_ht) as val 
            FROM mv_sales_enriched 
            GROUP BY 1 
            ORDER BY 2 DESC 
            LIMIT 5
        `;
        const sample = await db.query(sampleQuery);
        console.table(sample.rows);

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        process.exit();
    }
}

checkData();
