
import * as dotenv from 'dotenv';
import path from 'path';

// 1. Load .env.local BEFORE importing db
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    // 2. Dynamic Import of DB
    const { db } = await import('../src/lib/db');

    // 3. Find Pharmacy
    const pharmaRes = await db.query(`SELECT id, name FROM data_pharmacy WHERE name ILIKE '%mouysset%' LIMIT 1`);
    if (pharmaRes.rows.length === 0) {
        console.log('Pharmacy "mouysset" not found.');
        return;
    }
    const pharmacy = pharmaRes.rows[0];
    console.log('Target Pharmacy:', pharmacy.name, `(${pharmacy.id})`);

    const START_DATE = '2025-12-01'; 
    const END_DATE = '2025-12-31';

    console.log(`\nAnalyzing Sales for period: ${START_DATE} to ${END_DATE}`);

    // 4. Query data_sales
    // User said "data_sales", checking schema assumptions:
    // Usually linked to data_receipt (receipt_id) -> data_pharmacy (pharmacy_id)
    const realSalesQuery = `
        SELECT 
            COUNT(*) as nb_lines,
            COALESCE(SUM(s.price_ttc), 0) as total_ttc,
            COALESCE(SUM(s.quantity), 0) as total_qty
        FROM data_sales s
        JOIN data_receipt r ON s.receipt_id = r.id
        WHERE r.pharmacy_id = $1
          AND r.sale_date >= $2::date 
          AND r.sale_date <= $3::date
    `;

    try {
        console.log('\n--- Querying DATA_SALES (Raw) ---');
        const realSalesRes = await db.query(realSalesQuery, [pharmacy.id, START_DATE, END_DATE]);
        console.log(realSalesRes.rows[0]);
    } catch (e: any) {
        console.error('Error querying data_sales:', e.message);
    }

    // 5. Query MV_SALES_ENRICHED (Used in Ventes Repo)
    const mvQuery = `
        SELECT 
            COUNT(*) as nb_rows,
            SUM(montant_ttc) as total_ttc_calc, -- montant_ht * (1+tva) calculated in extraction usually? 
            -- Actually check schema or just use what we assume. 
            -- Repo used: SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0))
            SUM(montant_ht) as total_ht,
            SUM(quantity) as total_qty
        FROM mv_sales_enriched
        WHERE pharmacy_id = $1
          AND sale_date >= $2::date 
          AND sale_date <= $3::date
    `;
    
    try {
        console.log('\n--- Querying MV_SALES_ENRICHED (VM) ---');
        const mvRes = await db.query(mvQuery, [pharmacy.id, START_DATE, END_DATE]);
        console.log(mvRes.rows[0]);
    } catch (e: any) {
        console.error('Error querying mv_sales_enriched:', e.message);
    }

    // 6. Query MV_PRODUCT_STATS_MONTHLY (Used in Lab Repo, might be relevant)
    const statsQuery = `
        SELECT 
            SUM(ttc_sold) as total_ttc,
            SUM(qty_sold) as total_qty
        FROM mv_product_stats_monthly
        WHERE pharmacy_id = $1
          AND month >= $2::date 
          AND month <= $3::date
    `;

     try {
        console.log('\n--- Querying MV_PRODUCT_STATS_MONTHLY (Stats) ---');
        const statsRes = await db.query(statsQuery, [pharmacy.id, START_DATE, END_DATE]);
        console.log(statsRes.rows[0]);
    } catch (e: any) {
        console.error('Error querying mv_product_stats_monthly:', e.message);
    }

  } catch (error) {
    console.error('Fatal execution error:', error);
  } finally {
    process.exit();
  }
}

main();
