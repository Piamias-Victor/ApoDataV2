import { db } from '../src/lib/db';

async function debugStock() {
    try {
        console.log('🔍 Debugging Stock for 2024-11-30...');

        // 1. Count rows in MV before date
        const countRes = await db.query(
            "SELECT COUNT(*) as exact_count FROM mv_stock_monthly WHERE month_end_date <= '2024-11-30'"
        );
        console.log('📊 Rows in MV <= 2024-11-30:', countRes.rows[0].exact_count);

        // 2. See sample rows
        if (Number(countRes.rows[0].exact_count) > 0) {
            const sample = await db.query(
                "SELECT * FROM mv_stock_monthly WHERE month_end_date <= '2024-11-30' ORDER BY month_end_date DESC LIMIT 5"
            );
            console.log('📅 Sample rows <= 2024-11-30:', sample.rows);
        } else {
            console.log('⚠️ No rows found! Checking closest date...');
            const closest = await db.query(
                "SELECT MIN(month_end_date) as min, MAX(month_end_date) as max FROM mv_stock_monthly"
            );
            console.log('📅 MV Range:', closest.rows[0]);
        }

        // 3. Test Repository Query Logic manually
        const query = `
            WITH LatestSnapshots AS (
                SELECT DISTINCT ON (mv.product_id)
                    mv.stock,
                    mv.stock_value_ht
                FROM mv_stock_monthly mv
                WHERE mv.month_end_date <= '2024-11-30'
                ORDER BY mv.product_id, mv.month_end_date DESC
            )
            SELECT 
                COALESCE(SUM(ls.stock), 0) as stock_quantity,
                COALESCE(SUM(ls.stock_value_ht), 0) as stock_value_ht
            FROM LatestSnapshots ls;
        `;
        const resQuery = await db.query(query);
        console.log('✅ Manual Query Result:', resQuery.rows[0]);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

debugStock();
