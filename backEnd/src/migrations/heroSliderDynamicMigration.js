import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export default async function heroSliderDynamicMigration() {
  try {
    logger.info("Running hero slider dynamic migration...");

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false
    `);

    await pool.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('hero_dynamic_enabled', 'true', 'Enable dynamic slides (activities + products) in hero slider')
      ON CONFLICT (key) DO NOTHING
    `);

    logger.info("hero slider dynamic migration complete");
  } catch (error) {
    logger.error("hero slider dynamic migration failed:", error.message);
  }
}
