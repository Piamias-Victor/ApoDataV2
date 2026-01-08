import { db } from './src/lib/db';

async function main() {
    try {
        console.log("Checking data_internalproduct for 'empty' name...");
        const checkProduct = await db.query(`
            SELECT id, name, code_13_ref_id, pharmacy_id 
            FROM data_internalproduct 
            WHERE name = 'empty' OR name IS NULL OR name = ''
            LIMIT 5
        `);
        console.log("Products explicitly named 'empty' or NULL:", checkProduct.rows);

        console.log("\nChecking mv_product_stats_daily for 'empty' label details...");
        const checkView = await db.query(`
             SELECT product_id, product_label, ean13, pharmacy_id
             FROM mv_product_stats_daily 
             WHERE product_label = 'empty' 
             LIMIT 5
        `);
        console.log("View rows:", checkView.rows);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
