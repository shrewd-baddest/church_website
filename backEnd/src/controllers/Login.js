import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import jwt from "jsonwebtoken";
dotenv.config();

export const Login = async (req, res) => {
  let { userReg, password } = req.body ?? {};

  userReg = userReg?.toUpperCase();

  if (!userReg || !password) {
    console.log("Username and password required");
    logger.error("Username and password required");
    return res.status(400).json({ status: false, message: "Username and password required" });
  }
 try {
    const result = await pool.query(
      `SELECT m.member_id, m.password, m.jumuiya_id, m.first_name, m.last_name, m.email, 
              ARRAY_AGG(r.role_name) as roles
       FROM members m 
       JOIN member_roles mr ON m.member_id = mr.member_id 
       JOIN roles r ON mr.role_id = r.role_id 
       WHERE m.member_id = $1
       GROUP BY m.member_id, m.password, m.jumuiya_id, m.first_name, m.last_name, m.email`,
      [userReg],
    );

    if (result.rows.length === 0) {
      logger.error("Invalid username or password");
      return res.status(401).json({ status: false, message: "Invalid username or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      logger.error("Invalid username or password");
      return res.status(401).json({ status: false, message: "Invalid username or password" });
    }

    const accessToken = generateAccesstoken(user.member_id, user.roles, user.first_name, user.last_name, user.email, user.jumuiya_id);
    const refreshToken = generateRefreshtoken(user.member_id, user.roles);

    // Save hashed refresh token to database
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 20); // Matches generateRefreshtoken expiresIn: "20h"

    await pool.query(
      `INSERT INTO refresh_tokens (member_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.member_id, hashedToken, expiresAt]
    );

    res.status(200).json({
      status: "success",
      accessToken,
      refreshToken,
      role: user.roles, // returning role as array
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      jumuiya_id: user.jumuiya_id
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
              ARRAY_AGG(r.role_name) as roles
       FROM members m 
       JOIN member_roles mr ON m.member_id = mr.member_id 
       JOIN roles r ON mr.role_id = r.role_id 
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

    // Update existing token record or insert new one (simplest is to insert and we keep the rotation logic)
    // Here we choose to delete old ones for this user to keep DB clean
    // Update existing token record or insert new one (rotation)
    await pool.query(`DELETE FROM refresh_tokens WHERE member_id = $1`, [user.member_id]);
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
