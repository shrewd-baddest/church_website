import { testDb as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const run = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(50) NOT NULL,
        member_name VARCHAR(200),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(100),
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_member ON activity_logs(member_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC)`);

    console.log("✓ activity_logs table created");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
};

run();
