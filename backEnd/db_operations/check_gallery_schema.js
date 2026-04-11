
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

async function check() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hub_gallery'");
  console.log("HUB_GALLERY COLUMNS:");
  console.table(res.rows);
  process.exit(0);
}

check();
