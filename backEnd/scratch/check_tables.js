import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:");
    res.rows.forEach(row => console.log("- " + row.table_name));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

check();
