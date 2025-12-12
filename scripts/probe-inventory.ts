import { db } from '../src/lib/db';

async function probe() {
    try {
        console.log('🔍 Probing data_inventory schema...');
        const res = await db.query('SELECT * FROM data_inventory LIMIT 1');

        if (res.rows.length === 0) {
            console.log('⚠️ Table exists but is empty. Columns:', res.fields.map((f: any) => f.name));
        } else {
            console.log('✅ Columns:', Object.keys(res.rows[0]));
        }
    } catch (error: any) {
        console.error('❌ Error probing schema :', error.message);
    } finally {
        process.exit(0);
    }
}

probe();
