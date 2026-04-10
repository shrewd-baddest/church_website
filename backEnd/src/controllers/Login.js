import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
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
    const result = await testDb?.query(
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
    logger.error("Server error", err);
    res.status(500).json({ status: false, message: "Server error" });
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

    //  Check if token exists in DB
    const result = await testDb.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 
AND revoked = FALSE 
AND expires_at > NOW()`,
      [refreshToken],
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
    const userResult = await testDb.query(
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

    res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
};
