
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:NNPwUUstdTonFYZwfisO@phardev-new.c5mq4m26gfku.eu-west-3.rds.amazonaws.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
    return pool.query(text, params);
}

async function testMonthlyStats() {
    try {
        console.log('Testing Monthly Stats Query...');

        // Params
        const d1 = '2025-01-01';
        const d2 = '2025-12-31';
        const d3 = '2024-01-01';
        const d4 = '2024-12-31';
        
        // 1. Base Query (No filters) using new logic
        const queryBase = `
            SELECT COUNT(*) as count
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE 
                ((mv.month >= $1::date AND mv.month <= $2::date) OR (mv.month >= $3::date AND mv.month <= $4::date))
                AND mv.ean13 != 'NO-EAN'
        `;
        const res1 = await query(queryBase, [d1, d2, d3, d4]);
        console.log('Count Base (Date Ranges + NO-EAN):', res1.rows[0].count);

        // 2. With is_reimbursable = false (The filter used in app)
        const queryFilter = `
            SELECT COUNT(*) as count
            FROM mv_product_stats_monthly mv
            LEFT JOIN data_globalproduct gp ON gp.code_13_ref = mv.ean13
            WHERE 
                ((mv.month >= $1::date AND mv.month <= $2::date) OR (mv.month >= $3::date AND mv.month <= $4::date))
                AND mv.ean13 != 'NO-EAN'
                AND gp.is_reimbursable = false
        `;
        const res2 = await query(queryFilter, [d1, d2, d3, d4]);
        console.log('Count WITH is_reimbursable=false:', res2.rows[0].count);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

testMonthlyStats();
