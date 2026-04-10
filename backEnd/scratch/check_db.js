import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // Force SSL but ignore cert for Aiven
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

    const galleryTable = res.rows.find(r => r.table_name === 'gallery' || r.table_name === 'hub_gallery');
    if (galleryTable) {
      console.log(`\nContents of ${galleryTable.table_name}:`);
      const contents = await pool.query(`SELECT * FROM ${galleryTable.table_name} LIMIT 5`);
      console.log(JSON.stringify(contents.rows, null, 2));
    } else {
      console.log("\nNeither 'gallery' nor 'hub_gallery' tables found.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

check();
