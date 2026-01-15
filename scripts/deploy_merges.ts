import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

const SQL_FILES = [
    'sql/CREATE_MV_SALES.sql',
    'sql/CREATE_MV_STOCK.sql',
    'sql/CREATE_MV_LAB_STATS.sql',
    'sql/CREATE_MV_PRODUCT_STATS.sql',
    // 'sql/CREATE_MV_PRODUCT_STATS_MONTHLY.sql' // Handled separately to ensure population order
];

async function main() {
    try {
        console.log("🚀 Starting System Restoration (Revert)...");

        // DROP in reverse dependency order
        console.log("   Dropping existing views...");
        await pool.query("DROP MATERIALIZED VIEW IF EXISTS mv_product_stats_monthly CASCADE;");
        await pool.query("DROP MATERIALIZED VIEW IF EXISTS mv_product_stats_daily CASCADE;");
        await pool.query("DROP MATERIALIZED VIEW IF EXISTS mv_lab_stats_daily CASCADE;");
        await pool.query("DROP MATERIALIZED VIEW IF EXISTS mv_sales_enriched CASCADE;");
        await pool.query("DROP MATERIALIZED VIEW IF EXISTS mv_stock_monthly CASCADE;");

        for (const file of SQL_FILES) {
            console.log(`\n📄 Processing ${file}...`);
            const filePath = path.resolve(process.cwd(), file);
            let sql = fs.readFileSync(filePath, 'utf8');
            console.log(`   Executing SQL...`);
            await pool.query(sql);
            console.log(`   ✅ Success.`);
        }

        console.log("\n🔄 Populating Materialized Views...");
        
        console.log("   - mv_sales_enriched...");
        await pool.query("REFRESH MATERIALIZED VIEW mv_sales_enriched;");
        
        console.log("   - mv_stock_monthly...");
        await pool.query("REFRESH MATERIALIZED VIEW mv_stock_monthly;");

        console.log("   - mv_lab_stats_daily...");
        await pool.query("REFRESH MATERIALIZED VIEW mv_lab_stats_daily;");

        console.log("   - mv_product_stats_daily... (CRITICAL for next step)");
        await pool.query("REFRESH MATERIALIZED VIEW mv_product_stats_daily;");

        // NOW create and populate monthly stats
        console.log("\n📄 Processing sql/CREATE_MV_PRODUCT_STATS_MONTHLY.sql...");
        const monthlySqlPath = path.resolve(process.cwd(), 'sql/CREATE_MV_PRODUCT_STATS_MONTHLY.sql');
        const monthlySql = fs.readFileSync(monthlySqlPath, 'utf8');
        await pool.query(monthlySql); // Includes REFRESH at end usually, or is WITH NO DATA
        // Ensure it is refreshed
        console.log("   - mv_product_stats_monthly...");
        await pool.query("REFRESH MATERIALIZED VIEW mv_product_stats_monthly;");

        console.log("\n✅ SYSTEM RESTORED SUCCESSFULLY.");

    } catch (e) {
        console.error("\n❌ Restoration Failed:");
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
