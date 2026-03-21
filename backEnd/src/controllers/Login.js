import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import jwt from "jsonwebtoken";
import { token } from "morgan";
dotenv.config();

const Login = async (req, res) => {
  const { userReg, password } = req.body ?? [];

  if (!userReg || !password) {
    logger.warn("Login attempt with missing credentials");
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const result = await testDb.query(
      `SELECT m.member_id,m.password, m.email, r.role_name FROM members m 
      JOIN member_roles mr ON m.member_id = mr.member_id 
      JOIN roles r ON mr.role_id = r.role_id WHERE m.member_id =$1`,
      [userReg],
    );

    if (result.rows.length === 0) {
      logger.warn(`Login attempt with invalid username: ${userReg}`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      logger.warn(`Login attempt with invalid password for user: ${userReg}`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if(!user.email) {
      logger.warn(`Login attempt with missing email for user: ${userReg}`);
      return res.status(401).json({ error: "User email not found" });
    }

    const token = jwt.sign(
      { id: user.member_id, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      status: "success",
      message: "Login successful",
      
      token: token,
    });
  } catch (err) {
    logger.error("Error during login process", err);
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export default Login;
