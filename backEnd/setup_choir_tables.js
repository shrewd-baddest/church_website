
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

async function setupChoirTables() {
  const client = await pool.connect();
  try {
    console.log("--- CREATING CHOIR-SPECIFIC TABLES ---");

    // 1. Practice Schedules
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_schedules (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) REFERENCES hub_modules(id) ON DELETE CASCADE,
        day VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ hub_schedules table ready.");

    // 2. Music Classes
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_music_classes (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) REFERENCES hub_modules(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        instructor VARCHAR(100),
        schedule TEXT NOT NULL,
        description TEXT,
        skill_level VARCHAR(20) DEFAULT 'Beginner',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ hub_music_classes table ready.");

    // Seed data for Choir
    const choirSchedules = [
        ['choir', 'Tuesday', '18:00', '20:00', 'Church Hall'],
        ['choir', 'Saturday', '13:00', '16:00', 'Church Hall']
    ];

    for (const s of choirSchedules) {
        await client.query(`
            INSERT INTO hub_schedules (module_id, day, start_time, end_time, location)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING;
        `, s);
    }

    const choirClasses = [
        ['choir', 'Sight Reading', 'Dr. Music', 'Mondays 4PM', 'Learn to read music notes and understand basic music theory.', 'Beginner']
    ];

    for (const c of choirClasses) {
        await client.query(`
            INSERT INTO hub_music_classes (module_id, title, instructor, schedule, description, skill_level)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING;
        `, c);
    }

    console.log("✔ Seed data inserted for Choir.");

  } catch (err) {
    console.error("❌ SETUP FAILED:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupChoirTables();
