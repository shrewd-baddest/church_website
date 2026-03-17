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
  ssl: process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false }


=======
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
  ssl:
    process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
>>>>>>> origin/main
});

export const testDb = {
  query: (text, params) => pool.query(text, params),
};

export const connectDb = async () => {
  let client;
  try {
    client = await pool.connect();
<<<<<<< HEAD
    logger.info('Connected to postgree database successfully!');
  } catch (error) {
    logger.error('Failed to connect postgree database:', error.message, { stack: error.stack });
=======
    logger.info("Connected to postgree database successfully!");
  } catch (error) {
    logger.error("Failed to connect postgree database:", error.message, {
      stack: error.stack,
    });
>>>>>>> origin/main
    throw error; // Re-throw to prevent server from starting with a bad connection
  } finally {
    if (client) {
      client.release(); // Make sure to release the client
    }
  }
};

<<<<<<< HEAD


// momgodb connection this will be used for storing questions 
// this is the reason for this 
=======
// momgodb connection this will be used for storing questions
// this is the reason for this
>>>>>>> origin/main
//  You can insert 240 questions at once as an array of documents (insertMany), which fits MongoDB’s design perfectly.
// so you can automatically delete questions after 3 days without writing cron jobs. PostgreSQL doesn’t have native TTL; you’d need scheduled jobs or triggers.
// Questions can vary in structure (some may have 4 answers, others 5, some with longer explanations). MongoDB’s document model makes it easy to store these without rigid table definitions.
export let dbInstance = undefined;

const connectToMongoDb = async () => {
  try {
<<<<<<< HEAD
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
    dbInstance = connectionInstance;
    logger.info(
      `☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
=======
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`,
    );
    dbInstance = connectionInstance;
    logger.info(
      `☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`,
>>>>>>> origin/main
    );
  } catch (error) {
    logger.error("MongoDB connection error: ", error);
    // process.exit(1) removed - server continues
  }
};


<<<<<<< HEAD
export default connectToMongoDb;
=======
export default connectToMongoDb;
>>>>>>> origin/main
