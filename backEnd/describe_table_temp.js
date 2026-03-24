import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

async function describeTable() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    const tableName = 'jumuiya_officials';
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`Schema for ${tableName}:`);
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.end();
  }
}

describeTable();
