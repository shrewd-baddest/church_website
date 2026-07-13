import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const suggestionsEnrichment = async () => {
  try {
    logger.info("Running suggestions enrichment migration...");

    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS member_id VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT true
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_status VARCHAR(20) NOT NULL DEFAULT 'none'
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_requested_at TIMESTAMP
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_chair_token VARCHAR(64)
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_liturgist_token VARCHAR(64)
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_chair_responded BOOLEAN NOT NULL DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_liturgist_responded BOOLEAN NOT NULL DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_chair_approved BOOLEAN
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_liturgist_approved BOOLEAN
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_chair_responded_at TIMESTAMP
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS unmask_liturgist_responded_at TIMESTAMP
    `);

    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'new'
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS category VARCHAR(50)
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS admin_response TEXT
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP
    `);
    await pool.query(`
      ALTER TABLE suggestions
      ADD COLUMN IF NOT EXISTS responded_by VARCHAR(255)
    `);

    logger.info("Suggestions enrichment migration complete");
  } catch (error) {
    logger.error("Suggestions enrichment migration failed:", error.message);
    throw error;
  }
};

export { suggestionsEnrichment };
