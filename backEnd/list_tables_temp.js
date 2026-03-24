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

async function findTables() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables in database:');
    res.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    const jumuiyaTables = res.rows.filter(row => 
      row.table_name.toLowerCase().includes('jumuiya') || 
      row.table_name.toLowerCase().includes('official')
    );
    console.log('\nPotential Jumuiya/Official-related tables:');
    jumuiyaTables.forEach(row => console.log(`- ${row.table_name}`));

  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.end();
  }
}

findTables();
