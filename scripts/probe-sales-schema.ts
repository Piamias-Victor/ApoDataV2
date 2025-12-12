
import { db } from '../src/lib/db';

async function probe() {
    try {
        console.log('--- Probing data_sale ---');
        const resSale = await db.query('SELECT * FROM data_sale LIMIT 1');
        console.log('✅ data_sale columns:', Object.keys(resSale.rows[0] || {}));

        console.log('\n--- Probing data_productsale ---');
        const resProductSale = await db.query('SELECT * FROM data_productsale LIMIT 1');
        console.log('✅ data_productsale columns:', Object.keys(resProductSale.rows[0] || {}));

    } catch (error) {
        console.error('❌ Error probing schema:', (error as any).message);
    } finally {
        process.exit(0);
    }
}

probe();
