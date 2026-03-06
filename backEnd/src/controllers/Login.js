import dotenv from "dotenv";
dotenv.config();
import { db } from "../Configs/dbConfig.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Login = async (req, res) => {
  const { passWord, user: loginIdentifier, googleEmail } = req.body;
  console.log("Login request body:", req.body);

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
        return res.status(401).json({ message: "Invalid username or email" });
      }

      user = response.rows[0];

      // Compare password
      const storedPassword = user.password;
      if (!storedPassword) {
        return res.status(401).json({ message: "Account has no password set" });
      }

      const isMatch = await bcrypt.compare(passWord, storedPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    } else if (googleEmail) {
      // Google Login usually targets members who have emails
      const response = await db.query("SELECT * FROM members WHERE email = $1", [
        googleEmail,
      ]);
      if (response.rows.length === 0) {
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

    res.json({ token, status: "success", role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default Login;
