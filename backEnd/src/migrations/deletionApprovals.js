import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const deletionApprovalsMigration = async () => {
  try {
    logger.info("Running deletion approvals migration...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS deletion_approvals (
        id SERIAL PRIMARY KEY,
        official_id INTEGER NOT NULL REFERENCES officials(id) ON DELETE CASCADE,
        official_name VARCHAR(255),
        official_position VARCHAR(255),
        initiator_id VARCHAR(255),
        initiator_name VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,

        chair_token VARCHAR(64),
        chair_responded BOOLEAN NOT NULL DEFAULT false,
        chair_approved BOOLEAN,
        chair_responded_at TIMESTAMP,

        secretary_token VARCHAR(64),
        secretary_responded BOOLEAN NOT NULL DEFAULT false,
        secretary_approved BOOLEAN,
        secretary_responded_at TIMESTAMP,

        coordinator_token VARCHAR(64),
        coordinator_responded BOOLEAN NOT NULL DEFAULT false,
        coordinator_approved BOOLEAN,
        coordinator_responded_at TIMESTAMP
      )
    `);

    logger.info("Deletion approvals migration complete");
  } catch (error) {
    logger.error("Deletion approvals migration failed:", error.message);
    throw error;
  }
};

export { deletionApprovalsMigration };
