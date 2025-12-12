import { db } from '../src/lib/db';

async function probe() {
    try {
        console.log('🔍 Probing data_internalproduct schema...');
        const res = await db.query('SELECT * FROM data_internalproduct LIMIT 1');

        if (res.rows.length === 0) {
            console.log('⚠️ Table is empty, but columns are:', res.fields.map((f: any) => f.name));
        } else {
            console.log('✅ Columns:', Object.keys(res.rows[0]));
        }
    } catch (error) {
        console.error('❌ Error probing schema :', error);
    } finally {
        process.exit(0);
    }
}

probe();
