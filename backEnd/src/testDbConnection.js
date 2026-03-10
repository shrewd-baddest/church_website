import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD set:', !!process.env.DB_PASSWORD);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { 
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('\nAttempting to connect to database...');
    const client = await pool.connect();
    console.log('Connected to database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0]);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\nExisting tables:');
    tablesResult.rows.forEach(row => console.log(' -', row.table_name));
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('\nDatabase connection error:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    await pool.end();
  }
}

testConnection();

