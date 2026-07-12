import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const INDEXES = [
  // members table
  `CREATE INDEX IF NOT EXISTS idx_members_jumuiya_id ON members(jumuiya_id)`,
  `CREATE INDEX IF NOT EXISTS idx_members_migrated_to_associates ON members(migrated_to_associates)`,
  `CREATE INDEX IF NOT EXISTS idx_members_source ON members(source)`,
  `CREATE INDEX IF NOT EXISTS idx_members_year_of_study ON members(year_of_study)`,
  `CREATE INDEX IF NOT EXISTS idx_members_first_name ON members(first_name)`,
  `CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)`,
  `CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active)`,

  // registered table
  `CREATE INDEX IF NOT EXISTS idx_registered_member_id ON registered(member_id)`,
  `CREATE INDEX IF NOT EXISTS idx_registered_jumuiya_id ON registered(jumuiya_id)`,
  `CREATE INDEX IF NOT EXISTS idx_registered_status ON registered(status)`,

  // import_records table
  `CREATE INDEX IF NOT EXISTS idx_import_records_import_id ON import_records(import_id)`,
  `CREATE INDEX IF NOT EXISTS idx_import_records_status ON import_records(status)`,
  `CREATE INDEX IF NOT EXISTS idx_import_records_cleaned_reg ON import_records(cleaned_reg_number)`,

  // member_imports table
  `CREATE INDEX IF NOT EXISTS idx_member_imports_status ON member_imports(status)`,
  `CREATE INDEX IF NOT EXISTS idx_member_imports_academic_year ON member_imports(academic_year)`,
];

const performanceIndexes = async () => {
  try {
    logger.info("Running performance index migration...");
    for (const sql of INDEXES) {
      await pool.query(sql);
    }
    logger.info(`Performance index migration complete (${INDEXES.length} indexes created/verified)`);
  } catch (error) {
    logger.error("Performance index migration failed:", error.message);
    throw error;
  }
};

export { performanceIndexes };
