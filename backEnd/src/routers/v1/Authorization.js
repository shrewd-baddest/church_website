import { Router } from "express";
import Login from "../../controllers/Login.js";
import { OTPverification, Reset } from "../../controllers/Reset.js";

// v1authRoutes
// description on login the complete uri will be /authentication/v1/login
const v1authRoutes = Router();

v1authRoutes.post("/login", Login);
v1authRoutes.post("/reset", Reset);
v1authRoutes.post("/otp/:regNo", OTPverification);

export default v1authRoutes;
