import { Pool } from "pg";
import dotenv from "dotenv";
import logger from "../logger/winston.js";
import mongoose from "mongoose";
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
});

export const db = pool; // Alias for backward compatibility
// export const testDb = { query: (text, params) => pool.query(text, params),};

let client;
export const connectDb = async () => {
  try {
    client = await pool.connect();
    logger.info("Connected to PostgreSQL database successfully!");
  } catch (error) {
    logger.error("Failed to connect PostgreSQL database:", error.message, {
      stack: error.stack,
    });
    process.exit(1)
  } 
};
export const testDb = { query: (text, params) => client.query(text, params),};

// momgodb connection this will be used for storing questions
// this is the reason for this
//  You can insert 240 questions at once as an array of documents (insertMany), which fits MongoDB's design perfectly.
// so you can automatically delete questions after 3 days without writing cron jobs. PostgreSQL doesn't have native TTL; you'd need scheduled jobs or triggers.
// Questions can vary in structure (some may have 4 answers, others 5, some with longer explanations). MongoDB's document model makes it easy to store these without rigid table definitions.
export let dbInstance = undefined;

  export  const connectToMongoDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
    dbInstance = connectionInstance;
    logger.info(`☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.warn("MongoDB connection failed (optional - check MONGODB_URI in .env):", error.message);
    // Server continues with Postgres only
    // Fix: Use format mongodb+srv://USERNAME:PASSWORD@cluster0.nltpv7z.mongodb.net/questions?retryWrites=true&w=majority&authSource=admin
    // Replace USERNAME/PASSWORD with Atlas DB user creds, 'questions' as DB name
  }
};




