import { Router } from "express";
import Login from "../../controllers/Login.js";
import { OTPverification, Reset } from "../../controllers/Reset.js";
import verifyToken from "../../middleWares/Tokens.js";

// authRoutes
// description on login the complete uri will be /authentication/v1/login
const route = Router();

route.post("/login", Login);
route.post("/reset", Reset);
route.post("/reset-email", verifyToken, Reset);
route.post("/otp/:regNo", OTPverification);

export default route;
