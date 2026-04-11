
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
});

// Metadata from hubController.js
const modulesMeta = [
    {
        id: 'choir',
        title: 'St. Thomas Aquinas Choir',
        description: 'Join our heavenly voices in praise and worship.',
        color: '#ffffff',
        icon: 'fas fa-music'
    },
    {
        id: 'dancers',
        title: 'Liturgical Dancers',
        description: 'Expressing faith through rhythmic movement and grace.',
        color: '#e67e22',
        icon: 'fas fa-person-praying',
        scheduleLabel: 'Training Schedule',
        training: 'Every Saturday, 4:00 PM - 6:30 PM',
        location: 'School Compound',
        fees_registration: 'Free',
        fees_subscription: 'Ksh 20 weekly',
        fees_uniform: 'Orange T-shirt (Ksh 600) - Mandatory'
    },
    {
        id: 'charismatic',
        title: 'Charismatic Prayer Group',
        description: 'A community of faith, healing, and spiritual growth.',
        color: '#2ecc71',
        icon: 'fas fa-fire-alt',
        scheduleLabel: 'Meeting Schedule',
        training: 'Every Saturday, 5:00 PM - 6:30 PM',
        location: 'Parish Hall',
        fees_registration: 'Free',
        fees_subscription: 'None'
    },
    {
        id: 'st-francis',
        title: 'St. Francis of Assisi',
        description: 'Building bonds of love and support in our parish family.',
        color: '#2980b9',
        icon: 'fas fa-dove',
        scheduleLabel: 'Prayer Schedule',
        training: 'Every Sunday, 5:00 PM - 6:30 PM',
        location: 'LH 21',
        fees_registration: 'Ksh 20',
        fees_subscription: 'Ksh 20 (Per Semester)'
    }
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("--- STARTING COMMUNITY HUB DATABASE MIGRATION ---");

    // 1. Create hub_modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_modules (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        theme_color VARCHAR(20),
        icon_class VARCHAR(50),
        schedule_label VARCHAR(50) DEFAULT 'Meeting Schedule',
        training_time TEXT,
        location VARCHAR(100),
        registration_fee TEXT,
        subscription_fee TEXT,
        uniform_info TEXT,
        story TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ hub_modules table ready.");

    // 2. Create related tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_officials (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) REFERENCES hub_modules(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50),
        email VARCHAR(100),
        phone_number VARCHAR(20),
        photo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hub_activities (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) REFERENCES hub_modules(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        activity_date DATE,
        location VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Upcoming',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hub_announcements (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) REFERENCES hub_modules(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        announcement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hub_gallery (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) REFERENCES hub_modules(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        description TEXT,
        event_name VARCHAR(100),
        upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ Official, Activities, Announcements and Gallery tables ready.");

    // 3. Populate hub_modules from hardcoded meta
    for (const meta of modulesMeta) {
        await client.query(`
            INSERT INTO hub_modules (id, title, description, theme_color, icon_class, schedule_label, training_time, location, registration_fee, subscription_fee, uniform_info)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                theme_color = EXCLUDED.theme_color,
                icon_class = EXCLUDED.icon_class;
        `, [
            meta.id, meta.title, meta.description, meta.color, meta.icon, 
            meta.scheduleLabel || 'Meeting Schedule', meta.training || '', meta.location || '',
            meta.fees_registration || 'Free', meta.fees_subscription || 'None', meta.fees_uniform || ''
        ]);
    }
    console.log("✔ hub_modules populated/updated.");

    // 4. Migrate JSON Data for each module
    const dataDir = path.join(__dirname, 'src', 'data');
    const modules = ['choir', 'dancers', 'charismatic', 'st-francis'];
    
    for (const modId of modules) {
        // Officials
        const officialsFile = path.join(dataDir, `${modId}_officials.json`);
        if (fs.existsSync(officialsFile)) {
            const officials = JSON.parse(fs.readFileSync(officialsFile, 'utf8'));
            if (Array.isArray(officials)) {
                for (const off of officials) {
                    await client.query(`
                        INSERT INTO hub_officials (module_id, name, role, email, phone_number, photo_url)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT DO NOTHING;
                    `, [modId, off.name, off.role, off.email, off.phoneNumber, off.photoUrl]);
                }
            }
        }

        // Activities
        const activitiesFile = path.join(dataDir, `${modId}_activities.json`);
        if (fs.existsSync(activitiesFile)) {
            const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
            if (Array.isArray(activities)) {
                for (const act of activities) {
                    await client.query(`
                        INSERT INTO hub_activities (module_id, title, description, activity_date, location, status)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT DO NOTHING;
                    `, [modId, act.title, act.description, act.date || null, act.location || '', act.status || 'Upcoming']);
                }
            }
        }
        
        // Gallery (limited migrate for choir_gallery separately if needed, but we follow pattern)
        const galleryFile = path.join(dataDir, (modId === 'choir' ? 'choir_gallery.json' : `${modId}_gallery.json`));
        if (fs.existsSync(galleryFile)) {
            const gallery = JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
            if (Array.isArray(gallery)) {
                for (const img of gallery) {
                      await client.query(`
                        INSERT INTO hub_gallery (module_id, image_url, description, event_name)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT DO NOTHING;
                    `, [modId, img.imageUrl || img.filename, img.description, img.eventName]);
                }
            }
        }
    }
    console.log("✔ JSON data successfully migrated to PostgreSQL tables.");

    console.log("--- MIGRATION COMPLETED SUCCESSFULLY ---");
  } catch (err) {
    console.error("❌ MIGRATION FAILED:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
