import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { testDb } from "../Configs/dbConfig.js";
dotenv.config();

const Login = async (req, res) => {
  const { userReg, password } = req.body;
  console.log(userReg, password);

  if (!userReg || !password) {
    logger.warn("Login attempt with missing credentials");
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const result = await testDb.query(
      "SELECT * FROM members WHERE member_id = $1",
      [userReg],
    );

    if (result.rows.length === 0) {
      logger.warn(`Login attempt with invalid username: ${userReg}`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    logger.info(
      `Login attempt for user: ${userReg} - ${match ? "Success" : "Failure"}`,
    );
    if (!match) {
      logger.warn(`Login attempt with invalid password for user: ${userReg}`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // In production, generate a JWT instead of using member_id directly
    res.json({
      status: "success",
      message: "Login successful",
      // user: {
      //   id: user.member_id,
      //   username: user.member_id,
      //   email: user.email,
      // },
      // token: user.member_id,
    });
  } catch (err) {
    logger.error("Error during login process", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default Login;
