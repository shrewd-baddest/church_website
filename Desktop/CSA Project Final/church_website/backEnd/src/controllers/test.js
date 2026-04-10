import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { testDb } from "../Configs/dbConfig.js";
import verifyToken from "../middleWares/Tokens.js";
import logger from "../logger/winston.js";





app.post("/user", async (req, res) => {
  const { user, useruser } = req.body;

  if (!user || !useruser) {
    logger.warn("Login attempt with missing credentials");
    return res.status(400).json({ error: "User and useruser required" });
  }

  try {
    const result = await testDb.query(
      "SELECT * FROM members WHERE member_id = $1",
      [user]
    );

    if (result.rows.length === 0) {
      logger.warn(`Login attempt with invalid username: ${user}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const foundUser = result.rows[0];
    const match = await bcrypt.compare(useruser, foundUser.password);

    if (!match) {
      logger.warn(`Login attempt with invalid password for user: ${user}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: foundUser.member_id, username: foundUser.member_id, email: foundUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      status: "success",
      message: "Login successful",
      user: {
        id: foundUser.member_id,
        username: foundUser.member_id,
        email: foundUser.email,
      },
      token,
    });
  } catch (err) {
    logger.error("Error during login process", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/profile", verifyToken, async (req, res) => {
  try {
    const result = await testDb.query(
      "SELECT id, member_id, email FROM members WHERE member_id = $1",
      [req.user.id]
    );
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


