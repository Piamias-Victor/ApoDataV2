import { db } from '../src/lib/db';

async function checkStartDate() {
    try {
        console.log('🔍 Finding first date with positive stock...');
        const res = await db.query(
            "SELECT MIN(month_end_date) as first_positive_date FROM mv_stock_monthly WHERE stock > 0"
        );
        console.log('📅 First Positive Stock Date:', res.rows[0].first_positive_date);

        // Check if there's ANYTHING in Nov 2024 specifically
        const novCheck = await db.query(
            "SELECT COUNT(*) as c FROM mv_stock_monthly WHERE month_end_date = '2024-11-29' AND stock > 0" // Note: month end might be 29 or 30 depending on logic? generated was 29 in sample
        );
        console.log('Nov check count:', novCheck.rows[0].c);
        // Better: check using range for Nov
        const novRangeCheck = await db.query(
            "SELECT COUNT(*) as c FROM mv_stock_monthly WHERE month_end_date >= '2024-11-01' AND month_end_date <= '2024-11-30' AND stock > 0"
        );
        console.log('📊 Positive rows in Nov 2024:', novRangeCheck.rows[0].c);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkStartDate();
