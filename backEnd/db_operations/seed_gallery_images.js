
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

const images = [
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1775046063/zbskvdwmahtg2qqaypgi.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1775046062/ktca5y9ohajbwtxlz485.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1775046061/gribd0qoods1mzuyzbdt.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774987861/a7ozpjw1epnralr45bnd.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774987860/pkqalcafkxfzz5q8ptrf.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774987859/tpys9udugc6vtbix9ibc.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774987746/yhsrcgfrjqeyz2zv3ega.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774987746/uaxkboze8oc6gqlcton4.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774987744/gsdbwbszmzsftuakchx4.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774986947/jg4exrecgw7c1wp2ciip.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774986920/drt5cdtxbfjvnqdm1yay.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774986914/ca2pgwbxxbxlya57ixum.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774986204/eylqoplzrth5vswtrdjl.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774986203/snavbtyvlb9ncfllk394.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774986203/lruo4dd7nhwul6qnjbfl.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774985836/i3olntb6gaeuclput1ma.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774985834/ma8cxfe1m2u42tqhdf1y.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774985819/r7uavpjd6aqwvjgmryat.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774985125/ua1oqz0vxzyu7pv7qdbe.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774985089/a2uww016gzygzlnp89uc.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774985071/sv588lc2su94fyshhot4.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984746/kb1ubeoqzgccffzmv8tx.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984745/dqweavd8zisjfb5uz0ma.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984744/huikxkomgtkaje9qc2eb.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984269/uws1zfuevuknlrvkidnq.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984268/ye5ljffkbpzte8toue2l.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984265/jzcykstmcnohlrpaucov.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984054/oecp3htc1gzbtkxieatv.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774984001/dzesnup17ozkjxoulsno.png",
  "https://res.cloudinary.com/dnelprtgz/image/upload/v1774983999/m9pdumwacwqfyzcxooei.png"
];

const modules = ['choir', 'dancers', 'charismatic', 'st-francis'];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("--- SEEDING GALLERY IMAGES ---");
    
    // Clear existing gallery data to avoid duplicates if re-seeding
    await client.query('DELETE FROM hub_gallery');
    console.log("✔ Cleared existing gallery data.");

    for (let i = 0; i < images.length; i++) {
      const modId = modules[i % modules.length];
      const imageUrl = images[i];
      const eventName = `Annual Parish Celebration ${2024 - (i % 3)}`;
      const description = `Community members gathered for worship and celebration of faith.`;

      await client.query(`
        INSERT INTO hub_gallery (module_id, image_url, description, event_name)
        VALUES ($1, $2, $3, $4)
      `, [modId, imageUrl, description, eventName]);
    }

    console.log(`✔ Successfully seeded ${images.length} images across ${modules.length} modules.`);
    console.log("--- SEEDING COMPLETED ---");
  } catch (err) {
    console.error("❌ SEEDING FAILED:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
