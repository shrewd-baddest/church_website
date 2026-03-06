import pg from 'pg';
const { Client } = pg;
 import dotenv from 'dotenv';
dotenv.config();
 
const client = new Client({
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT ),
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ,
  ssl:   { 
    rejectUnauthorized: false
   } 
});

export const testDb = async () => {
  try {
    await client.connect();
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    console.log(error.message);
  }
};