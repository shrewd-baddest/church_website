import { Router } from "express";
import Login from "../controllers/Login.js";
import { OTPverification, Reset } from "../controllers/Reset.js";
import { createUser } from "../controllers/UserController.js";

export const auth = Router();

auth.post("/login", Login);
auth.post("/register", createUser);
auth.post("/reset", Reset);
auth.post("/otp/:regNo", OTPverification);
