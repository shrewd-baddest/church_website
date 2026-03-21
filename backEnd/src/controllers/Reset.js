import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const Reset = async (req, res) => {
  const { email, password, purpose } = req.body;

  logger.debug("Received reset request for user: " + userName);

  if (!email || !password || !purpose) {
    logger.warn("Reset attempt with missing fields");
    return res.status(400).send("Email, password, and purpose are required");
  }

  try {
    //   Check if user exists

    let userName = null;

    if (purpose === "email") {
      userName = req.body.userReg;
      const emailCheck = await testDb.query(
        `SELECT 1 FROM members WHERE email = $1`,
        [email],
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
    } else if (purpose === "password") {
      const userCheck = await testDb.query(
        `SELECT * FROM members WHERE email = $1`,
        [email],
      );
      if (userCheck.rows.length === 0) {
        logger.warn(`Password reset attempt for non-existent email: ${email}`);
        return res.status(404).send("User not found");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    //   Insert or update password_resets
    await testDb.query(
      `INSERT INTO password_resets (member_id, email, otp, otp_expires, temp_password)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (member_id) DO UPDATE 
       SET email = EXCLUDED.email,
           otp = EXCLUDED.otp,
           otp_expires = EXCLUDED.otp_expires,
           temp_password = EXCLUDED.temp_password`,
      [
        userName,
        email || existingUser.email,
        hashedOtp,
        expiresAt,
        hashedPassword,
      ],
    );

    if (existingUser.rowCount === 0) {
      logger.warn(`Reset attempt for non-existent user: ${userName}`);
      return res.status(404).json({ error: "User not found" });
    }

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
