import { Router } from "express";
import Login from "../../controllers/Login.js";
import { OTPverification, Reset } from "../../controllers/Reset.js";
import verifyToken from "../../middleWares/Tokens.js";
import sendEmail from "../../Configs/emailConfig.js";

// authRoutes
// description on login the complete uri will be /authentication/v1/login
const route = Router();

route.post("/login", Login);
route.post("/reset", Reset);
route.post("/reset-email", verifyToken, Reset);
route.post("/otp/:regNo", OTPverification);
route.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    await sendEmail(subject, text, to);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default route;
