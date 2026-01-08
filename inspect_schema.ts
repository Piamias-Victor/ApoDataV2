import { db } from './src/lib/db';

async function main() {
    try {
        const res = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'data_internalproduct'
        `);
        console.log("Columns:", res.rows.map(r => r.column_name));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
