
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query("SELECT count(*) as total, module_id FROM hub_gallery GROUP BY module_id");
  console.log("GALLERY DATA:", res.rows);
  process.exit(0);
}
run();
