import { testDb as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const migration = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS published_stats (
        id SERIAL PRIMARY KEY,
        stat_type VARCHAR(50) NOT NULL,
        stat_data JSONB NOT NULL,
        member_id VARCHAR,
        jumuiya_id VARCHAR,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR
      );
    `);
    logger.info("published_stats table created or already exists");
  } catch (err) {
    logger.error("published_stats migration failed:", err.message);
    throw err;
  }
};

export default migration;
