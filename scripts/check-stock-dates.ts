import { db } from '../src/lib/db';

async function checkDates() {
    try {
        console.log('🔍 Checking MV Stock date range...');
        const res = await db.query('SELECT MIN(month_end_date) as min_date, MAX(month_end_date) as max_date FROM mv_stock_monthly');
        console.log('📅 Date Range:', res.rows[0]);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkDates();
