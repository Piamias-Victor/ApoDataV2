import { db } from '../src/lib/db';

async function analyzeSnapshots() {
    try {
        console.log('🔍 Analyzing data_inventorysnapshot frequency...');

        // Count total rows
        const countRes = await db.query('SELECT COUNT(*) as total FROM data_inventorysnapshot');
        console.log('📊 Total rows:', countRes.rows[0].total);

        // Check frequency for one product
        const oneProduct = await db.query('SELECT product_id FROM data_inventorysnapshot LIMIT 1');
        if (oneProduct.rows.length > 0) {
            const pid = oneProduct.rows[0].product_id;
            console.log(`🔍 Checking frequency for product ${pid}`);

            const freqRes = await db.query(`
                SELECT date, stock 
                FROM data_inventorysnapshot 
                WHERE product_id = $1 
                ORDER BY date DESC 
                LIMIT 10
            `, [pid]);
            console.log('📅 Last 10 snapshots:', freqRes.rows);
        }

    } catch (error: any) {
        console.error('❌ Error probing schema :', error.message);
    } finally {
        process.exit(0);
    }
}

analyzeSnapshots();
