
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

async function migrate() {
  try {
    await pool.query("ALTER TABLE hub_gallery ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");
    console.log("✅ Column event_date added successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
