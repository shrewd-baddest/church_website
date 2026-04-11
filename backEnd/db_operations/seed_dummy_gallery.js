
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const dummyImages = [
  "https://images.unsplash.com/photo-1548625361-ec853715d0dd", // Church view
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3", // Community
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df", // Worship
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7", // Choir
  "https://images.unsplash.com/photo-1437603568260-1950d3ca6eab", // Prayer
  "https://images.unsplash.com/photo-1519491050282-cf00c82424b4", // Youth
  "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672", // Fellowship
  "https://images.unsplash.com/photo-1507673161836-399f1fa0674d", // Altar
  "https://images.unsplash.com/photo-1544427928-c49cdfebf494", // Cross
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018" // Celebration
];

async function seedDummyGallery() {
  console.log("🚀 Starting Dummy Gallery Seeding...");
  
  try {
    // Clear existing (optional - commented out to preserve real data if any)
    // await pool.query("DELETE FROM hub_gallery WHERE module_id IN ('general', 'choir', 'youth')");

    const today = new Date();
    
    for (let i = 0; i < dummyImages.length; i++) {
      const isAnniversary = i < 3; // Make first 3 images anniversaries
      const eventDate = new Date(today);
      
      if (isAnniversary) {
        // Set date to today or +/- 1 day, but in a PREVIOUS year
        eventDate.setFullYear(today.getFullYear() - (i + 1));
        if (i === 1) eventDate.setDate(today.getDate() + 1);
        if (i === 2) eventDate.setDate(today.getDate() - 1);
      } else {
        // Set date to some random month
        eventDate.setMonth(today.getMonth() - (i + 2));
      }

      const query = `
        INSERT INTO hub_gallery (module_id, image_url, description, event_name, event_date, is_spotlight, moderation_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      const values = [
        i % 3 === 0 ? 'general' : (i % 3 === 1 ? 'choir' : 'youth'),
        `${dummyImages[i]}?auto=format&fit=crop&q=80&w=1200`,
        `A beautiful reflection from our ${i % 3 === 0 ? 'Parish' : (i % 3 === 1 ? 'Choir' : 'Youth')} gathering. Capturing the faith and joy of our community at St. Thomas Aquinas.`,
        `Celebration ${2020 + i}`,
        eventDate,
        i < 2, // First 2 are spotlights
        'Approved'
      ];

      await pool.query(query, values);
      console.log(`✅ Seeded: ${values[3]} (${isAnniversary ? 'ANNIVERSARY' : 'NORMAL'})`);
    }

    console.log("\n✨ Seeding Complete! Refresh the Gallery to see the 'Proximity Algorithm' in action.");
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
  } finally {
    await pool.end();
  }
}

seedDummyGallery();
