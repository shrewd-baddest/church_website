import { testDb } from "../Configs/dbConfig.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Login = async (req, res) => {
  const { passWord, password, username, email, googleEmail } = req.body;
  // Accept both 'password' (from frontend) and 'passWord' 
  const userPassword = passWord || password;
  console.log("Login attempt with:", { username, email, googleEmail });
  try {
    // Check if user exists - support both username and email
    let user;
    if (username) {
      console.log("Trying username login...");
      const response = await testDb.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      console.log("Query result:", response.rows);
      if (response.rows.length === 0) {
        return res.status(401).json({ message: "Invalid username" });
      }

      user = response.rows[0];
      console.log("User found:", user);

      // Compare password
      const isMatch = await bcrypt.compare(userPassword, user.password);
      console.log("Password match:", isMatch);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    } else if (email) {
      const response = await testDb.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (response.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email" });
      }

      user = response?.rows[0];
    } else {
      return res.status(400).json({ message: "Username or email required" });
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate JWT token
    const secretKey = process.env.SECRET_KEY || "default-secret-key-change-in-production";
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      secretKey,
      { expiresIn: "1h" },
    );
    const role = user.role;
    
    // Return user data along with token
    return res.json({ 
      token, 
      status: "success", 
      user: {
        user_id: user.user_id,
        username: user.username || user.email.split('@')[0],
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
   return res.status(500).json({ message: "Server error: " + error.message });
  }
};

export default Login;
