import { db } from './src/lib/db';

async function main() {
    try {
        console.log("Searching for sales-related tables...");
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name ILIKE '%sale%' OR table_name ILIKE '%receipt%';
        `);
        console.log("Tables:", tables.rows.map(t => t.table_name));

        // If 'data_sale' or similar exists, check its columns
        const targetTable = tables.rows.find(t => t.table_name === 'data_sale' || t.table_name === 'sale')?.table_name || 'data_sale';
        
        console.log(`\nInspecting columns of '${targetTable}'...`);
        const columns = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${targetTable}'
        `);
        console.log("Columns:", columns.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
