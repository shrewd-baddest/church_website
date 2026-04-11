import { testDb as pool } from "../src/Configs/dbConfig.js";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const query = `
        SELECT o.id, o.name, o.category, o.photo, o.position, o.contact, o.term_of_service, o.created_at, o.status,
               et.name as term_name, et.year as term_year
        FROM officials o
        LEFT JOIN election_terms et ON o.election_term_id = et.id
        WHERE (o.status = 'active' OR o.status IS NULL)
        ORDER BY o.category, o.position`;
    
    console.log("Running query...");
    const result = await pool.query(query);
    const msg = `Success! Rows: ${result.rows.length}`;
    console.log(msg);
    fs.writeFileSync('./query_output.txt', msg);
  } catch (error) {
    const errMsg = `DATABASE ERROR: ${error.message}\nFULL ERROR: ${JSON.stringify(error, null, 2)}`;
    console.error(errMsg);
    fs.writeFileSync('./query_output.txt', errMsg);
  } finally {
    process.exit();
  }
}

test();
