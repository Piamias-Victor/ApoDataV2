const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function debug() {
  try {
    const pharmId = '0ca185d4-041e-40b6-8a9f-cad2e72c4d7b'; 
    console.log('--- Checking Sold Products Sample for VAROISE ---');
    const res = await pool.query(
      `SELECT 
         ip.name as internal_name, 
         gp.bcb_lab as global_lab, 
         gp.label as global_label 
       FROM data_sales s 
       JOIN data_internalproduct ip ON s.product_id = ip.internal_id 
       LEFT JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref 
       WHERE s.date >= $1 AND ip.pharmacy_id = $2
       LIMIT 20`, 
      ['2025-01-01', pharmId]
    );
    console.table(res.rows);

  } catch (e) { 
      console.error(e); 
  } finally { pool.end(); }
}
debug();
