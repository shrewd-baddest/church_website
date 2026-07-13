import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const suggestionBinMigration = async () => {
  try {
    logger.info("Running suggestion bin migration...");

    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255)
    `);

    logger.info("Suggestion bin migration complete");
  } catch (error) {
    logger.error("Suggestion bin migration failed:", error.message);
    throw error;
  }
};

export { suggestionBinMigration };
