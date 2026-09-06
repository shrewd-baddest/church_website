import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const setupAssociatesSystem = async () => {
  try {
    logger.info("Setting up Associates (alumni) system tables...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS associates (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(30) NOT NULL,
        name VARCHAR(200) NOT NULL,
        gender VARCHAR(10),
        email VARCHAR(200),
        phone VARCHAR(50),
        jumuiya_name VARCHAR(100),
        jumuiya_id VARCHAR(50),
        year_of_study VARCHAR(20),
        admission_year INTEGER,
        graduation_year INTEGER,
        source VARCHAR(20) DEFAULT 'legacy',
        migrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        migrated_by VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(member_id)
      );
    `);

    await pool.query(`
      ALTER TABLE members
      ADD COLUMN IF NOT EXISTS migrated_to_associates BOOLEAN DEFAULT false;
    `);

    await pool.query(`
      ALTER TABLE import_records
      ADD COLUMN IF NOT EXISTS migrated_to_associates BOOLEAN DEFAULT false;
    `);

    await pool.query(`
      ALTER TABLE associates
      ADD COLUMN IF NOT EXISTS module_id VARCHAR(50);
    `);

    logger.info("Associates system tables created successfully");
  } catch (error) {
    logger.error("Failed to create Associates system tables:", error.message);
    throw error;
  }
};

export { setupAssociatesSystem };
