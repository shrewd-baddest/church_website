import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const Reset = async (req, res) => {
  const { email, password, purpose } = req.body;

  if (!email || !password || !purpose) {
    logger.warn("Reset attempt with missing fields");
    return res.status(400).json({
      error: "Email, password, and purpose are required",
    });
  }

  try {
    let memberId;

    if (purpose === "email") {
      // Get user from token (middleware must set req.user)
      if (!req.user || !req.user.member_id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      memberId = req.user.member_id;

      // Check if new email already exists
      const emailCheck = await testDb.query(
        `SELECT 1 FROM members WHERE email = $1`,
        [email],
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
    } else if (purpose === "password") {
      const userCheck = await testDb.query(
        `SELECT member_id FROM members WHERE email = $1`,
        [email],
      );

      if (userCheck.rows.length === 0) {
        logger.warn(`Password reset attempt for non-existent email: ${email}`);
        return res.status(404).json({ error: "User not found" });
      }

      memberId = userCheck.rows[0].member_id;
    } else {
      return res.status(400).json({ error: "Invalid purpose" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const OTP = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await testDb.query(
      `INSERT INTO password_resets (member_id, email, otp, otp_expires, temp_password)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (member_id) DO UPDATE 
       SET email = EXCLUDED.email,
           otp = EXCLUDED.otp,
           otp_expires = EXCLUDED.otp_expires,
           temp_password = EXCLUDED.temp_password`,
      [memberId, email, hashedOtp, expiresAt, hashedPassword],
    );

    await sendMail(
      email,
      "Reset OTP",
      `Your OTP is ${OTP}. It expires in 10 minutes.`,
    );

    logger.info(`OTP sent to ${email}`);

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    logger.error("Error during reset process:", error);
    return res.status(500).json({ error: error.message });
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
