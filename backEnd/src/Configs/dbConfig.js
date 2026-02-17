import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const testDb = async () => {
  try {
    const client = await db.connect();
    console.log("✅ PostgreSQL connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  }
};
