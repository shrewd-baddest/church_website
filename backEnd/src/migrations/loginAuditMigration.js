import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const loginAuditMigration = async () => {
  try {
    logger.info("Running login_audit_log migration...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_audit_log (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(30),
        email VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const indexes = [
      ["idx_login_audit_member", "member_id"],
      ["idx_login_audit_action", "action"],
      ["idx_login_audit_created", "created_at DESC"],
    ];
    for (const [name, cols] of indexes) {
      await pool.query(`CREATE INDEX IF NOT EXISTS ${name} ON login_audit_log (${cols});`).catch(() => {});
    }

    logger.info("login_audit_log migration complete");
  } catch (error) {
    logger.error("login_audit_log migration failed:", error.message);
  }
};

export default loginAuditMigration;
