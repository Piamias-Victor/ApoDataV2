import { db } from '../src/lib/db';

async function checkNonZero() {
    try {
        console.log('🔍 Checking for ANY positive stock in 2024...');

        const countRes = await db.query(
            "SELECT COUNT(*) as positive_count FROM mv_stock_monthly WHERE month_end_date <= '2024-12-31' AND stock > 0"
        );
        console.log('📊 Positive Stock Rows in 2024:', countRes.rows[0].positive_count);

        if (Number(countRes.rows[0].positive_count) > 0) {
            const sample = await db.query(
                "SELECT * FROM mv_stock_monthly WHERE month_end_date <= '2024-12-31' AND stock > 0 LIMIT 1"
            );
            console.log('📅 First positive sample:', sample.rows[0]);
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkNonZero();
