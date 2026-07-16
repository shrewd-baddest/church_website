import pg from "pg";
const { Pool, types } = pg;
import dotenv from "dotenv";
import logger from "../logger/winston.js";

// Parse timestamp without timezone (OID 1114) as UTC
types.setTypeParser(1114, (str) => new Date(str + "Z"));


// Ensure we load the backend env file (church_website/backEnd/.env)
// rather than whatever the process CWD happens to be.
dotenv.config({
  path: new URL("../../.env", import.meta.url),
});




const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "csa_db",
  ssl:
    // Explicit control: set DB_SSL=true when your Postgres requires SSL.
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});


export const db = pool;

export let client = undefined;
export const connectDb = async () => {
  try {
    client = await pool.connect();
    logger.info("Connected to postgree database successfully!");
  } catch (error) {
    logger.error(`Failed to connect postgree database: ${error.message}`, {
      stack: error.stack,
    });
    // Removed process.exit(1) to allow server to stay alive and retry connections via pool
  }
};

// use the pool for queries to handle connections automatically
export const testDb = {
  query: (text, params) => pool.query(text, params)
};


