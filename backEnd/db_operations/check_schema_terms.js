import { testDb as pool } from "../src/Configs/dbConfig.js";
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'election_terms'
    `);
    console.log("COLUMNS IN 'election_terms' TABLE:");
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    console.error("SCHEMA ERROR:", error.message);
  } finally {
    process.exit();
  }
}

checkSchema();
