import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

export const Reset = async (req, res) => {
  const { userName, email, password } = req.body;

  logger.debug("Received reset request for user: " + userName);

  // Validate input

  if (!userName || !password) {
    logger.warn("Reset attempt with missing fields");
    return res.status(400).send("userName, email, password are required");
  }
  // check if user exists
  const userCheck = await testDb.query(
    `SELECT * FROM members WHERE member_id = $1`,
    [userName],
  );
  if (userCheck.rows.length === 0) {
    logger.warn(
      `Reset attempt for non-existent user: ${userName} with email: ${email}`,
    );
    return res.status(404).send("User not found");
  }

  // Hash the new password and generate OTP
  const hashedPassword = await bcrypt.hash(password, 10);
  const OTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");

  // Set OTP expiration time ( 10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Update user record with hashed OTP, expiration time, and new password

  var query;
  email
    ? (query = `INSERT INTO password_resets (member_id, email, otp, otp_expires, temp_password)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (member_id) DO UPDATE 
  SET email = EXCLUDED.email, otp = EXCLUDED.otp, otp_expires = EXCLUDED.otp_expires, temp_password = EXCLUDED.temp_password`)
    : (query = `INSERT INTO password_resets (member_id, otp, otp_expires, temp_password)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (member_id) DO UPDATE 
  SET otp = EXCLUDED.otp, otp_expires = EXCLUDED.otp_expires, temp_password = EXCLUDED.temp_password`);

  const user = await testDb.query(
    `INSERT INTO password_resets (member_id, otp, otp_expires)
   VALUES ($1, $2, $3)
   ON CONFLICT (member_id) DO UPDATE 
   SET reset_otp = EXCLUDED.reset_otp, reset_otp_expires = EXCLUDED.reset_otp_expires`,
    [userName, hashedOtp, expiresAt],
  );
  // Send OTP to user's email

  await sendMail("password reset OTP", OTP, email);
  logger.info(
    `Password reset OTP sent to email: ${email} for user: ${userName}`,
  );
  return res.status(200).json("user updated successfully");
};

export const OTPverification = async (req, res) => {
  const reg = decodeURIComponent(req.params.regNo);
  const { otp, passWord } = req.body;
  const hashedInputOtp = crypto.createHash("sha256").update(otp).digest("hex");

  // Fetch the stored OTP and expiration time for the user
  const user = await testDb.query(
    `SELECT reset_otp, reset_otp_expires 
   FROM members 
   WHERE member_id = $1`,
    [reg],
  );

  if (
    user.rows[0].reset_otp !== hashedInputOtp ||
    new Date() > user.rows[0].reset_otp_expires
  ) {
    await testDb.query(
      `UPDATE members 
   SET password = $1, reset_otp = NULL, reset_otp_expires = NULL
   WHERE member_id = $1`,
      [reg],
    );
    logger.warn(`Invalid or expired OTP attempt for user: ${reg}`);
    return res.status(400).json({ message: "Invalid or expired OTP" });
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
