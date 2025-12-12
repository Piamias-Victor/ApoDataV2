import { db } from '../src/lib/db';

async function probe() {
    try {
        console.log('🔍 Probing mv_latest_product_prices schema...');
        const res = await db.query('SELECT * FROM mv_latest_product_prices LIMIT 1');

        if (res.rows.length === 0) {
            console.log('⚠️ MV is empty, but columns are:', res.fields.map((f: any) => f.name));
        } else {
            console.log('✅ Columns:', Object.keys(res.rows[0]));
            console.log('✅ Sample Row:', res.rows[0]);
        }
    } catch (error) {
        console.error('❌ Error probing schema :', error);
    } finally {
        process.exit(0);
    }
}

probe();
