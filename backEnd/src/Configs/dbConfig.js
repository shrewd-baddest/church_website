import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from '../logger/winston.js';
dotenv.config();

 
const pool = new Pool({
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ,
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }
});

export const testDb = {
  query: (text, params) => pool.query(text, params),
};

export const connectDb = async () => {
  let client;
  try {
    client = await pool.connect();
    logger.info('Connected to the database successfully!');
  } catch (error) {
    logger.error('Failed to connect to the database:', error.message, { stack: error.stack });
    throw error; // Re-throw to prevent server from starting with a bad connection
  } finally {
    if (client) {
      client.release(); // Make sure to release the client
    }
  }
};
