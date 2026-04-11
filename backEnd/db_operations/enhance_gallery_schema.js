
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

async function enhanceSchema() {
  const client = await pool.connect();
  try {
    console.log("--- ENHANCING GALLERY SCHEMA ---");

    // 1. Update hub_gallery with new fields
    await client.query(`
      ALTER TABLE hub_gallery 
      ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS seasonal_theme VARCHAR(50),
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'Approved',
      ADD COLUMN IF NOT EXISTS contributor_id INT,
      ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);
    `);
    console.log("✔ hub_gallery table updated with new columns.");

    // 2. Create Comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_gallery_comments (
        id SERIAL PRIMARY KEY,
        gallery_id INT REFERENCES hub_gallery(id) ON DELETE CASCADE,
        user_id INT,
        user_name VARCHAR(100),
        comment TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ hub_gallery_comments table ready.");

    // 3. Create Reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_gallery_reactions (
        id SERIAL PRIMARY KEY,
        gallery_id INT REFERENCES hub_gallery(id) ON DELETE CASCADE,
        user_id INT,
        emoji VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ hub_gallery_reactions table ready.");

    // 4. Mark some existing images as spotlight for teaser
    await client.query(`
      UPDATE hub_gallery 
      SET is_spotlight = TRUE 
      WHERE id IN (
        SELECT id FROM hub_gallery ORDER BY upload_date DESC LIMIT 2
      );
    `);
    console.log("✔ Annotated latest 2 images as spotlight.");

    console.log("--- SCHEMA ENHANCEMENT COMPLETED ---");
  } catch (err) {
    console.error("❌ ENHANCEMENT FAILED:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

enhanceSchema();
