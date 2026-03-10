import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
 
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
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    throw error; // Re-throw to prevent server from starting with a bad connection
  } finally {
    if (client) {
      client.release(); // Make sure to release the client
    }
  }
};
