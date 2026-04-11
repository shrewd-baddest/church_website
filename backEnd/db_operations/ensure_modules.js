
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
  try {
    await pool.query("INSERT INTO hub_modules (id, title) VALUES ('general', 'General Parish'), ('youth', 'Youth Ministry') ON CONFLICT (id) DO NOTHING");
    console.log("✅ Modules ensured");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
