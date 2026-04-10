import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { testDb as db } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import jwt from "jsonwebtoken";

dotenv.config();

const Login = async (req, res) => {
  const { passWord, user: loginIdentifier, googleEmail } = req.body;
  logger.info("Login request received", { loginIdentifier, googleEmail });

  try {
    let user;
    let table = "users";

    if (loginIdentifier) {
      // 1. Try to find in users table by username
      let response = await db.query("SELECT * FROM users WHERE username = $1", [
        loginIdentifier,
      ]);

      if (response.rows.length === 0) {
        // 2. Fallback: Try to find in members table by email
        response = await db.query("SELECT * FROM members WHERE email = $1", [
          loginIdentifier,
        ]);
        table = "members";
      }

      if (response.rows.length === 0) {
        logger.warn("Invalid username or email login attempt", { loginIdentifier });
        return res.status(401).json({ message: "Invalid username or email" });
      }

      user = response.rows[0];

      // Compare password
      const storedPassword = user.password;
      if (!storedPassword) {
        logger.warn("Account has no password set", { loginIdentifier });
        return res.status(401).json({ message: "Account has no password set" });
      }

      const isMatch = await bcrypt.compare(passWord, storedPassword);
      if (!isMatch) {
        logger.warn("Invalid password for user", { loginIdentifier });
        return res.status(401).json({ message: "Invalid password" });
      }
    } else if (googleEmail) {
      // Google Login usually targets members who have emails
      const response = await db.query("SELECT * FROM members WHERE email = $1", [
        googleEmail,
      ]);
      if (response.rows.length === 0) {
        logger.warn("Google email not registered", { googleEmail });
        return res.status(401).json({ message: "Email not registered" });
      }

      user = response.rows[0];
      table = "members";
    } else {
      return res.status(400).json({ message: "Missing login credentials" });
    }

    // Determine ID and Role based on table
    const id = table === "users" ? user.user_id : user.member_id;
    const role = table === "users" ? user.role : "member";

    // Generate JWT token
    const token = jwt.sign(
      { id, role },
      process.env.SECRET_KEY || "default_secret",
      { expiresIn: "1h" },
    );

    logger.info("Login successful", { id, role });
    return res.json({
      token,
      status: "success",
      role,
      user: {
        user_id: id,
        username: loginIdentifier || (user.username || googleEmail),
        role
      }
    });
  } catch (error) {
    logger.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default Login;
