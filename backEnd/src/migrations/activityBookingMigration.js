import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const activityBookingMigration = async () => {
  try {
    logger.info("Running activity booking migration...");

    await pool.query(`
      ALTER TABLE weekly_activities
      ADD COLUMN IF NOT EXISTS fare DECIMAL(10,2) DEFAULT NULL
    `);
    await pool.query(`
      ALTER TABLE semester_activities
      ADD COLUMN IF NOT EXISTS fare DECIMAL(10,2) DEFAULT NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_bookings (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(50) NOT NULL REFERENCES members(member_id),
        activity_type VARCHAR(10) NOT NULL CHECK (activity_type IN ('weekly', 'semester')),
        activity_id INTEGER NOT NULL,
        fare DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_payments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES activity_bookings(id) ON DELETE CASCADE,
        checkout_id VARCHAR(100),
        merchant_request_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        phone VARCHAR(20),
        mpesa_receipt VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
        result_code VARCHAR(10),
        result_desc TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Security: add attempts column to password_resets for OTP brute-force protection
    await pool.query(`
      ALTER TABLE password_resets
      ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0
    `);

    // Defer email save: add pending_email so email is only stored after verification
    await pool.query(`
      ALTER TABLE members
      ADD COLUMN IF NOT EXISTS pending_email VARCHAR(100)
    `);

    logger.info("Activity booking migration complete");
  } catch (error) {
    logger.error("Activity booking migration failed:", error.message);
    throw error;
  }
};

export { activityBookingMigration };
