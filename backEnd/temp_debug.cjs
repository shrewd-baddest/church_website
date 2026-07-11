const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, ssl: { rejectUnauthorized: false },
});
(async () => {
  const slugToJumuiyaName = {
    "st-anthony": "St. Anthony", "st-augustine": "St. Augustine",
    "st-catherine": "St. Dominic", "st-dominic": "St. Dominic",
    "st-elizabeth": "St. Elizabeth", "st-maria-goretti": "St. Maria Goretti",
    "st-monica": "St. Monica",
  };

  // Simulate the controller query
  const jumuiya_id = 'st-anthony';
  const resolvedName = slugToJumuiyaName[jumuiya_id] || jumuiya_id;
  console.log('Resolved name:', resolvedName);

  const params = [];
  const conditions = [];
  conditions.push(`(jumuiya_id = $${params.length + 1} OR jumuiya_name = $${params.length + 1})`);
  params.push(resolvedName);

  const query = `SELECT * FROM associates WHERE ${conditions.join(" AND ")} ORDER BY graduation_year DESC, name ASC`;
  console.log('Query:', query);
  console.log('Params:', params);

  const result = await pool.query(query, params);
  console.log('Result count:', result.rows.length);
  result.rows.forEach(r => {
    console.log(`  ${r.member_id} | name=${r.jumuiya_name} | jumuiya_id=${r.jumuiya_id} | source=${r.source}`);
  });

  pool.end();
})();
