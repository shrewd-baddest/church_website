import { db } from '../backEnd/src/Configs/dbConfig.js';

async function checkOfficials() {
  try {
    const res = await db.query("SELECT id, name, status FROM officials");
    console.log("Total officials:", res.rowCount);
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOfficials();
