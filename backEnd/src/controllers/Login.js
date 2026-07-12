import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import jwt from "jsonwebtoken";
import sendMail from "../Configs/emailConfig.js";
dotenv.config();

export const Login = async (req, res) => {
  let { userReg, password } = req.body ?? {};

  userReg = userReg?.trim().toUpperCase();

  if (!userReg || !password) {
    console.log("Username and password required");
    logger.error("Username and password required");
    return res.status(400).json({ status: false, message: "Username and password required" });
  }
 try {
    const result = await pool.query(
      `SELECT 
        m.member_id, 
        m.password, 
        m.jumuiya_id, 
        m.first_name, 
        m.last_name, 
        m.email,
        m.email_verified,
        m.email_verification_token,
        COALESCE(
          ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          ARRAY[]::text[]
        ) as roles
      FROM members m 
      LEFT JOIN member_roles mr ON m.member_id = mr.member_id AND mr.status = 'approved'
      LEFT JOIN roles r ON mr.role_id = r.role_id 
      WHERE m.member_id = $1
      GROUP BY m.member_id, m.password, m.jumuiya_id, m.first_name, m.last_name, m.email, m.email_verified, m.email_verification_token`,
      [userReg],
    );

    if (result.rows.length === 0) {
      logger.error(`Invalid username or password for '${userReg || "<empty>"}'`);
      return res.status(401).json({ status: false, message: "Invalid username or password" });
    }

    const user = result.rows[0];

    const storedHash = typeof user.password === 'string' ? user.password.trim() : user.password;

    // Determine whether the stored password is a bcrypt hash or a legacy plaintext value
    const isBcrypt = storedHash && (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$') || storedHash.startsWith('$2y$'));

    let match = false;
    if (isBcrypt) {
      match = await bcrypt.compare(password, storedHash);
      if (!match) {
        // Default password is the uppercased registration number — the user
        // may have typed it in a different case.
        match = await bcrypt.compare(password.toUpperCase(), storedHash);
      }
    } else if (storedHash) {
      // Legacy plaintext password — compare directly
      match = password === storedHash || password.toUpperCase() === storedHash;
    }

    if (!match) {
      logger.error(`Invalid username or password for '${userReg}'`);
      return res.status(401).json({
        status: false,
        message: "Invalid username or password"
      });
    }

    // Detect first login: password matches their reg number, or missing email
    let isDefaultPassword = false;
    if (isBcrypt) {
      isDefaultPassword = await bcrypt.compare(userReg, storedHash);
    } else if (storedHash) {
      isDefaultPassword = userReg === storedHash;
    }
    const forcePasswordChange = isDefaultPassword || !user.email;

    // Block login if user has an unverified email from a recent first-login-setup
    // (email_verification_token is only set when firstLoginSetup added an email)
    if (!forcePasswordChange && user.email && !user.email_verified && user.email_verification_token) {
      return res.status(403).json({
        status: false,
        message: "Please verify your email before logging in. Check your inbox for the verification link we sent."
      });
    }

    const accessToken = generateAccesstoken(user.member_id, user.roles, user.first_name, user.last_name, user.email, user.jumuiya_id);
    const refreshToken = generateRefreshtoken(user.member_id, user.roles);

    // Save hashed refresh token to database
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 20);

    await pool.query(
      `INSERT INTO refresh_tokens (member_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.member_id, hashedToken, expiresAt]
    );

    res.status(200).json({
      status: "success",
      member_id: user.member_id,
      accessToken,
      refreshToken,
      role: user.roles,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      jumuiya_id: user.jumuiya_id,
      forcePasswordChange,
      hasEmail: !!user.email,
    });
  } catch (err) {
    logger.error("Server error during login:", err);
    console.error("Login Error Details:", err);
    res.status(500).json({ 
      status: false, 
      message: "Server internal error",
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const generateAccesstoken = (id, role, firstName, lastName, email, jumuiya_id) => {
  return jwt.sign({ id, role, firstName, lastName, email, jumuiya_id }, process.env.JWT_SECRET, { expiresIn: "15min" });
};

export const generateRefreshtoken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "20h",
  });
};

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    //  Check if any active tokens exist for this user in DB
    const result = await pool.query(
      `SELECT * FROM refresh_tokens WHERE member_id = $1 AND expires_at > NOW()`,
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    let validToken = null;

    for (const row of result.rows) {
      const isMatch = await bcrypt.compare(refreshToken, row.token);

      if (isMatch) {
        validToken = row;
        break;
      }
    }
    if (!validToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    //  Generate new access token
    const userResult = await pool.query(
      `SELECT m.member_id, m.jumuiya_id, m.first_name, m.last_name, m.email,
              COALESCE(
                ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
                ARRAY[]::text[]
              ) as roles
       FROM members m
       LEFT JOIN member_roles mr ON m.member_id = mr.member_id AND mr.status = 'approved'
       LEFT JOIN roles r ON mr.role_id = r.role_id
       WHERE m.member_id = $1
       GROUP BY m.member_id, m.jumuiya_id, m.first_name, m.last_name, m.email`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: "User no longer exists" });
    }

    const user = userResult.rows[0];
    const accessToken = generateAccesstoken(user.member_id, user.roles, user.first_name, user.last_name, user.email, user.jumuiya_id);
    const newRefreshToken = generateRefreshtoken(user.member_id, user.roles);

    // Save new hashed refresh token to database
    const hashedToken = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 20);

    // Rotate only the matched refresh token record, without invalidating other active sessions for the same user.
    await pool.query(`DELETE FROM refresh_tokens WHERE id = $1`, [validToken.id]);
    await pool.query(
      `INSERT INTO refresh_tokens (member_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.member_id, hashedToken, expiresAt]
    );

    res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error("Refresh error:", error);
    console.error("Refresh Error Details:", error);
    return res.status(error.status || 403).json({ 
      error: error.message,
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * First-login setup: force password change + optional email update.
 * Verifies current password (should be the default reg number) before
 * allowing the update.
 */
export const firstLoginSetup = async (req, res) => {
  try {
    const { member_id, currentPassword, newPassword, email } = req.body;

    if (!member_id || !currentPassword || !newPassword) {
      return res.status(400).json({ status: false, message: "member_id, currentPassword, and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: false, message: "New password must be at least 6 characters" });
    }

    // Fetch member
    const member = await pool.query(
      "SELECT member_id, password, first_name, last_name FROM members WHERE member_id = $1",
      [member_id]
    );
    if (member.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Member not found" });
    }

    const storedHash = typeof member.rows[0].password === 'string' ? member.rows[0].password.trim() : member.rows[0].password;
    const isBcrypt = storedHash && (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$') || storedHash.startsWith('$2y$'));
    let valid = false;
    if (isBcrypt) {
      valid = await bcrypt.compare(currentPassword, storedHash);
    } else if (storedHash) {
      valid = currentPassword === storedHash;
    }
    if (!valid) {
      return res.status(401).json({ status: false, message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password and optionally email
    if (email && email.trim()) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        `UPDATE members SET password = $1, email = $2, email_verified = FALSE,
         email_verification_token = $4, email_verification_expires = $5 WHERE member_id = $3`,
        [hashed, email.trim(), member_id, token, expires]
      );
      try {
        const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
        await sendMail(
          "Verify your email — CSA Kirinyaga",
          `Hi ${member_id},\n\nPlease verify your email by clicking the link below:\n${FRONTEND_URL}/verify-email?token=${token}&reg=${encodeURIComponent(member_id)}\n\nThis link expires in 24 hours.\n\n— CSA Kirinyaga Chapter`,
          email.trim()
        );
      } catch (mailErr) {
        logger.error("Failed to send verification email:", mailErr.message, mailErr.stack);
      }
    } else {
      await pool.query(
        "UPDATE members SET password = $1 WHERE member_id = $2",
        [hashed, member_id]
      );
    }

    res.json({ status: true, message: "Password updated successfully" });
  } catch (error) {
    logger.error("firstLoginSetup error:", error.message);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token, reg } = req.body;

    if (!token || !reg) {
      return res.status(400).json({ status: false, message: "Token and registration number are required" });
    }

    const result = await pool.query(
      `SELECT member_id, email_verification_token, email_verification_expires
       FROM members WHERE member_id = $1 AND email_verification_token = $2`,
      [reg, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ status: false, message: "Invalid verification token" });
    }

    const member = result.rows[0];
    if (new Date() > member.email_verification_expires) {
      return res.status(400).json({ status: false, message: "Verification token has expired" });
    }

    await pool.query(
      `UPDATE members SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE member_id = $1`,
      [reg]
    );

    res.json({ status: true, message: "Email verified successfully" });
  } catch (error) {
    logger.error("verifyEmail error:", error.message);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { member_id } = req.body;
    if (!member_id) {
      return res.status(400).json({ status: false, message: "member_id is required" });
    }

    const result = await pool.query(
      `SELECT email, email_verification_token, email_verification_expires, email_verified
       FROM members WHERE member_id = $1`,
      [member_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Member not found" });
    }

    const member = result.rows[0];

    if (member.email_verified) {
      return res.status(400).json({ status: false, message: "Email is already verified" });
    }

    if (!member.email) {
      return res.status(400).json({ status: false, message: "No email on record to verify" });
    }

    // If token expired or missing, generate a new one
    let token = member.email_verification_token;
    let expires = member.email_verification_expires;
    if (!token || (expires && new Date() > expires)) {
      token = crypto.randomBytes(32).toString("hex");
      expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        `UPDATE members SET email_verification_token = $1, email_verification_expires = $2 WHERE member_id = $3`,
        [token, expires, member_id]
      );
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    await sendMail(
      "Verify your email — CSA Kirinyaga",
      `Hi ${member_id},\n\nPlease verify your email by clicking the link below:\n${FRONTEND_URL}/verify-email?token=${token}&reg=${encodeURIComponent(member_id)}\n\nThis link expires in 24 hours.\n\n— CSA Kirinyaga Chapter`,
      member.email
    );

    res.json({ status: true, message: "Verification email sent" });
  } catch (error) {
    logger.error("resendVerification error:", error.message, error.stack);
    res.status(500).json({ status: false, message: "Failed to send verification email. Please try again later." });
  }
};
