const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function debug() {
  try {
    const pharmId = '0ca185d4-041e-40b6-8a9f-cad2e72c4d7b'; 
    console.log('--- Checking Sales for VAROISE (Count) ---');
    const res = await pool.query(
      "SELECT COUNT(*) FROM data_sales s JOIN data_internalproduct ip ON s.product_id = ip.internal_id WHERE s.date >= $1 AND ip.pharmacy_id = $2", 
      ['2025-01-01', pharmId]
    );
    console.log('Sales Count:', res.rows[0].count);

    console.log('\n--- Checking Sales for VAROISE + NHCO (Count) ---');
    const res2 = await pool.query(
      "SELECT COUNT(*) FROM data_sales s JOIN data_internalproduct ip ON s.product_id = ip.internal_id LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref WHERE s.date >= $1 AND ip.pharmacy_id = $2 AND gp.bcb_lab ILIKE $3",
      ['2025-01-01', pharmId, '%NHCO%']
    );
    console.log('Sales Count (NHCO):', res2.rows[0].count);

  } catch (e) { 
      console.error(e); 
  } finally { pool.end(); }
}
debug();
