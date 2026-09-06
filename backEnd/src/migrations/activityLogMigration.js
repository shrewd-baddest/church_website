import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const activityLogMigration = async () => {
  logger.info("Running activity_logs migration...");

  const columns = [
    "id SERIAL PRIMARY KEY",
    "actor_id VARCHAR(30)",
    "actor_name VARCHAR(255) NOT NULL DEFAULT 'Unknown'",
    "actor_role VARCHAR(200)",
    "jumuiya_id VARCHAR(50)",
    "jumuiya_name VARCHAR(100)",
    "action VARCHAR(150) NOT NULL",
    "entity_type VARCHAR(150)",
    "entity_id VARCHAR(255)",
    "details JSONB DEFAULT '{}'",
    "ip_address VARCHAR(45)",
    "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
  ];

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        ${columns.join(",\n        ")}
      );
    `);
  } catch (error) {
    logger.error("activity_logs table create failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack,
    });
  }

  // Fix actor_id type: was INTEGER but members.member_id is VARCHAR(30).
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'activity_logs' AND column_name = 'actor_id'
            AND data_type = 'integer'
        ) THEN
          ALTER TABLE activity_logs ALTER COLUMN actor_id TYPE VARCHAR(30);
        END IF;
      END $$;
    `);
  } catch (error) {
    logger.error("activity_logs actor_id type fix failed:", {
      message: error.message,
      code: error.code,
    });
  }

  // Repair a table left half-created by a previous failed run: each column is
  // added idempotently, so a rerun converges to the full schema.
  for (const def of columns) {
    const match = def.match(/^([a-z_]+)\s/);
    if (!match) continue;
    const name = match[1];
    if (name === "id") continue;
    try {
      await pool.query(
        `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ${name} ${def.slice(name.length).trim()};`
      );
    } catch (error) {
      logger.error(`activity_logs column backfill failed (${name}):`, {
        message: error.message,
        code: error.code,
        detail: error.detail,
      });
    }
  }

  const indexes = [
    ["idx_activity_logs_created_at", "created_at DESC"],
    ["idx_activity_logs_actor", "actor_id"],
    ["idx_activity_logs_action", "action"],
    ["idx_activity_logs_jumuiya", "jumuiya_id"],
  ];
  for (const [name, cols] of indexes) {
    try {
      await pool.query(
        `CREATE INDEX IF NOT EXISTS ${name} ON activity_logs (${cols});`
      );
    } catch (error) {
      logger.error(`activity_logs index ${name} failed:`, {
        message: error.message,
        code: error.code,
        detail: error.detail,
      });
    }
  }

  logger.info("activity_logs migration complete");
};

export default activityLogMigration;
