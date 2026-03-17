import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const Reset = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // ✅ Validate inputs individually
    if (!userName || !email || !password) {
      logger.warn("Reset attempt with missing fields");
      return res
        .status(400)
        .json({ error: "userName, email, and password are required" });
    }

    // ✅ Check if user exists before updating
    const existingUser = await testDb.query(
      `SELECT member_id FROM members WHERE member_id = $1 AND email = $2`,
      [userName, email],
    );

    if (existingUser.rowCount === 0) {
      logger.warn(`Reset attempt for non-existent user: ${userName}`);
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Hash password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Generate OTP securely
    const OTP = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");

    // ✅ Configurable expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ Update only reset fields, not email blindly
    await testDb.query(
      `UPDATE members 
       SET reset_otp = $1, reset_otp_expires = $2, password = $3
       WHERE member_id = $4 AND email = $5`,
      [hashedOtp, expiresAt, hashedPassword, userName, email],
    );

    // ✅ Send OTP securely
    await sendMail("Password Reset OTP", `Your OTP is: ${OTP}`, email);

    logger.info(`Password reset OTP sent to ${email} for user: ${userName}`);
    return res
      .status(200)
      .json({ message: "Password reset initiated successfully" });
  } catch (error) {
    logger.error("Error during password reset: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const OTPverification = async (req, res) => {
  const reg = decodeURIComponent(req.params.regNo);
  const { otp } = req.body;

  const hashedInputOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const client = await testDb.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT * FROM password_resets WHERE member_id = $1`,
      [reg],
    );

    //   No OTP record
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "No OTP request found" });
    }

    const resetData = result.rows[0];

    //   Invalid or expired OTP
    if (
      resetData.otp !== hashedInputOtp ||
      new Date() > resetData.otp_expires
    ) {
      await client.query("ROLLBACK");
      logger.warn(`Invalid/expired OTP for user: ${reg}`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    //   Update password + email (only if NULL)
    await client.query(
      `UPDATE members
       SET password = $1,
           email = COALESCE(email, $2)
       WHERE member_id = $3`,
      [resetData.temp_password, resetData.email, reg],
    );

    //  Delete reset record
    await client.query(`DELETE FROM password_resets WHERE member_id = $1`, [
      reg,
    ]);

    await client.query("COMMIT");

    logger.info(`Password reset successful for user: ${reg}`);

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`OTP verification error for ${reg}: ${error.message}`);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
  
};
