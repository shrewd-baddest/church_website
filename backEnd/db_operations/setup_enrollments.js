
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
});

async function createEmbeddingsTable() {
  const client = await pool.connect();
  try {
    console.log("--- CREATING ENROLLMENTS TABLE ---");

    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        class_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        voice_type VARCHAR(50),
        music_level VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Pending',
        enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ enrollments table ready.");

  } catch (err) {
    console.error("❌ SETUP FAILED:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createEmbeddingsTable();
