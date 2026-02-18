import { Router } from "express";
import Login from "../controllers/Login.js";
import { OTPverification, Reset } from "../controllers/Reset.js";

export const auth = Router();

auth.post("/login", Login);
auth.post("/reset", Reset);
auth.post("/otp/:regNo", OTPverification);
