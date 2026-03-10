import crypto from "crypto";
import sendMail from "../Configs/emailConfig.js";
import bcrypt from "bcrypt";
import { client } from "../Configs/dbConfig.js";

export const Reset = async (req, res) => {
  const { userName, email, password } = req.body;

  logger.debug("Received reset request for user: " + userName);

  if (!userName && !email && !password) {
    logger.warn("Reset attempt with missing fields");
    return res.status(400).send("userName, email, password are required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const OTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await client.query(
    `UPDATE members 
   SET reset_otp = $1, reset_otp_expires = $2 ,email=$3,password=$4
   WHERE member_id = $5`,
    [hashedOtp, expiresAt, email, hashedPassword, userName],
  );

  await sendMail("password reset OTP", OTP, email);
  logger.info(`Password reset OTP sent to email: ${email} for user: ${userName}`);
  return res.status(200).json("user updated successfully");
};

export const OTPverification = async (req, res) => {
  const reg = decodeURIComponent(req.params.regNo);
  const { otp } = req.body;
  const hashedInputOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await client.query(
    `SELECT reset_otp, reset_otp_expires 
   FROM members 
   WHERE member_id = $1`,
    [reg],
  );

  if (
    user.rows[0].reset_otp !== hashedInputOtp ||
    new Date() > user.rows[0].reset_otp_expires
  ) {
    await client.query(
      `UPDATE members 
   SET password = $1, reset_otp = NULL, reset_otp_expires = NULL
   WHERE member_id = $1`,
      [reg],
    );
logger.warn(`Invalid or expired OTP attempt for user: ${reg}`); 
  } else {
    await client.query(
      `UPDATE members 
   SET  reset_otp = NULL, reset_otp_expires = NULL
   WHERE member_id = $1`,
      [reg],
    );
    logger.info(`Successful OTP verification for user: ${reg}`);
    return res.status(200).json({ message: "password updated successfully" });
  }
};
