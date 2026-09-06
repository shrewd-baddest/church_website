import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export default async function communityModuleChannelsMigration() {
  try {
    logger.info("Running community module channels migration...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_module_channels (
        id SERIAL PRIMARY KEY,
        module_id VARCHAR(50) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(module_id, platform)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_community_module_channels_module_id
      ON community_module_channels(module_id);
    `);

    logger.info("Community module channels migration complete");
  } catch (error) {
    logger.error("Community module channels migration failed:", error.message);
  }
}