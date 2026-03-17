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

  const user = await testDb.query(
    `SELECT reset_otp, reset_otp_expires 
   FROM members 
   WHERE member_id = $1`,
    [reg],
  );

  if ( user.rows[0].reset_otp !== hashedInputOtp || new Date() > user.rows[0].reset_otp_expires  )
     {
    await testDb.query(
      `UPDATE members 
   SET password = $1, reset_otp = NULL, reset_otp_expires = NULL
   WHERE member_id = $1`,
      [reg],
    );

    logger.warn(`Invalid or expired OTP attempt for user: ${reg}`);
  } else {

    await testDb.query(
      `UPDATE members 
   SET  reset_otp = NULL, reset_otp_expires = NULL
   WHERE member_id = $1`,
      [reg],
    );


    logger.info(`Successful OTP verification for user: ${reg}`);
    return res.status(200).json({ message: "password updated successfully" });
  }
  
};
