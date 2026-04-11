
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
});

async function createTable() {
  const client = await pool.connect();
  try {
    console.log("Checking if suggestions table exists...");
    
    // Create the table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS suggestions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        suggestion TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Suggestions table ready!");

    // Also update schema_output.json by running the update_schema.js logic
  } catch (err) {
    console.error("Error creating suggestions table:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

createTable();
