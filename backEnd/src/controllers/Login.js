import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import jwt from "jsonwebtoken";
import { token } from "morgan";
dotenv.config();

export const Login = async (req, res) => {
  const { userReg, password } = req.body ?? {};

  if (!userReg || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const result = await testDb.query(
      `SELECT m.member_id, m.password, m.first_name, m.email, r.role_name 
       FROM members m 
       JOIN member_roles mr ON m.member_id = mr.member_id 
       JOIN roles r ON mr.role_id = r.role_id 
       WHERE m.member_id = $1`,
      [userReg],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const accessToken = generateAccesstoken(user.member_id, user.role_name);
    const refreshToken = generateRefreshtoken(user.member_id, user.role_name);

    // calculate expiry
    const decoded = jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000); // exp is in seconds

    // store in DB
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    await testDb.query(
      `INSERT INTO refresh_tokens (member_id, token, expires_at)
   VALUES ($1, $2, $3)`,
      [user.member_id, hashedToken, expiresAt],
    );

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const generateAccesstoken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15min" });
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
    const accessToken = generateAccesstoken(decoded.id, decoded.role);

    res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
};
