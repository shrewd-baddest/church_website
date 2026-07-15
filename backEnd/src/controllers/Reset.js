import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";
import bcrypt from "bcrypt";
import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("a number");
  return errors;
};

export const resendOTP = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Reset token is required" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM password_resets WHERE id = $1 AND otp_expires > NOW()`,
      [token],
    );
    if (result.rows.length === 0) {
      logger.warn(`Resend OTP attempt with invalid/expired token: ${token}`);
      return res.status(404).json({ error: "Reset session expired. Please start again." });
    }

    const record = result.rows[0];
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `UPDATE password_resets SET otp = $1, otp_expires = $2, attempts = 0 WHERE id = $3`,
      [hashedOtp, expiresAt, token],
    );

    await sendMail("Reset OTP", `Your OTP is ${OTP}. It expires in 10 minutes.`, record.email);
    logger.info(`OTP resent for member: ${record.member_id}`);
    return res.json({ status: "success", message: "OTP resent to your email" });
  } catch (error) {
    logger.error("Error resending OTP:", error);
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
};

export const Reset = async (req, res) => {
  const { email, password, purpose } = req.body;

  if (!email || !password || !purpose) {
    logger.warn("Reset attempt with missing fields");
    return res.status(400).send("Email, password, and purpose are required");
  }

  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    logger.warn(`Weak password attempt for ${email}: missing ${passwordErrors.join(", ")}`);
    return res.status(400).json({
      error: `Password must contain ${passwordErrors.join(", ")}`,
    });
  }

  try {
    let userName = null;
    let existingUser = null;

    if (purpose === "email") {
      userName = req.body.userReg;
      const emailCheck = await pool.query(
        `SELECT 1 FROM members WHERE email = $1`,
        [email],
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
    } else if (purpose === "password") {
      const userCheck = await pool.query(
        `SELECT member_id, email, email_verified FROM members WHERE email = $1`,
        [email],
      );
      if (userCheck.rows.length === 0) {
        logger.warn(`Password reset attempt for non-existent email: ${email}`);
        return res.status(404).send("User not found");
      }
      existingUser = userCheck.rows[0];
      if (!existingUser.email_verified) {
        logger.warn(`Password reset attempt for unverified email: ${email}`);
        return res.status(403).json({ error: "Email not verified. Please verify your email before resetting your password." });
      }
      userName = existingUser.member_id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate any existing OTP records for this member (brute-force prevention)
    await pool.query(
      `UPDATE password_resets SET otp = '', attempts = 3 WHERE member_id = $1`,
      [userName],
    );

    const insertResult = await pool.query(
      `INSERT INTO password_resets (member_id, email, otp, otp_expires, temp_password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userName, email, hashedOtp, expiresAt, hashedPassword],
    );

    const resetToken = insertResult.rows[0].id;

    await sendMail(
      "Reset OTP",
      `Your OTP is ${OTP}. It expires in 10 minutes.`,
      email,
    );

    logger.info(`Password reset OTP sent to ${email} for member: ${userName}`);
    return res.status(200).json({
      status: "success",
      reset_token: resetToken,
      message: "Password reset initiated successfully",
    });
  } catch (error) {
    logger.error("Error during password reset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const OTPverification = async (req, res) => {
  const { token } = req.params;
  const { otp } = req.body;

  if (!token || !otp) {
    return res.status(400).json({ error: "Token and OTP are required" });
  }

  const hashedInputOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT * FROM password_resets WHERE id = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      logger.warn(`OTP verification with invalid token: ${token}`);
      return res.status(404).json({ error: "Invalid or expired reset session" });
    }

    const resetData = result.rows[0];

    // Check attempt limit
    if (resetData.attempts >= 3) {
      await client.query("ROLLBACK");
      logger.warn(`OTP brute-force blocked for member: ${resetData.member_id}`);
      return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    // Check OTP match and expiry
    if (resetData.otp !== hashedInputOtp || new Date() > resetData.otp_expires) {
      await client.query(
        `UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1`,
        [token],
      );
      await client.query("COMMIT");
      const remaining = 2 - resetData.attempts;
      logger.warn(`Invalid/expired OTP for member: ${resetData.member_id}, attempts: ${resetData.attempts + 1}`);
      return res.status(400).json({
        error: remaining > 0
          ? `Invalid or expired OTP. ${remaining} attempt(s) remaining.`
          : "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Update password
    const updateResult = await client.query(
      `UPDATE members
       SET password = $1,
           email = COALESCE(email, $2)
       WHERE member_id = $3`,
      [resetData.temp_password, resetData.email, resetData.member_id],
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      logger.error(`Password update failed — member not found: ${resetData.member_id}`);
      return res.status(500).json({ error: "Account not found" });
    }

    // Invalidate all sessions for this member
    await client.query(`DELETE FROM refresh_tokens WHERE member_id = $1`, [
      resetData.member_id,
    ]);

    // Delete reset record
    await client.query(`DELETE FROM password_resets WHERE id = $1`, [token]);

    await client.query("COMMIT");

    // Send confirmation email
    try {
      await sendMail(
        "Password Changed Successfully",
        `Your CSA account password was just changed. If you did not make this change, please contact the administrator immediately.`,
        resetData.email,
      );
    } catch {
      // non-blocking — don't fail if confirmation email fails
    }

    logger.info(`Password reset successful for member: ${resetData.member_id}, sessions invalidated`);
    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`OTP verification error: ${error.message}`);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};