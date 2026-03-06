import dotenv from "dotenv";
dotenv.config();
import { testDb } from "../Configs/dbConfig.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Login = async (req, res) => {
  const { passWord, email, googleEmail } = req.body;
  try {
    // Check if user exists
    let user;
    if (email) {
      const response = await testDb.query("SELECT * FROM users  WHERE email = $1", [
        email,
      ]);
      if (response.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email" });
      }

      
      user = response.rows[0];

      
      // Compare password
      const isMatch = await bcrypt.compare(passWord, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid  password" });
      }
    } else if (googleEmail) {
      const response = await testDb.query("SELECT * FROM users  WHERE email = $1", [
        googleEmail,
      ]);
      if (response.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email" });
      }

      user = response?.rows[0];
    }

    // // Generate JWT token
    // const token = jwt.sign(
    //   { id: user.id, role: user.role },
    //   process.env.SECRET_KEY,
    //   { expiresIn: "1h" },
    // );
    // const role = user.role;
  //  return res.json({ token, status: "success", role });

    return res.json({ status: "success", });
  } catch (error) {
    console.error(error);
   return res.status(500).json({ message: "Server error " });
  }
};

export default Login;
