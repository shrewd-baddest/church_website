import { Router } from "express";
import { Login, refreshAccessToken } from "../../controllers/Login.js";
import { OTPverification, Reset } from "../../controllers/Reset.js";
import verifyToken, { logOut } from "../../middleWares/Tokens.js";
import sendEmail from "../../Configs/emailConfig.js";
import { stkCalls, stkGuestCalls, checkStatus } from "../../controllers/stkPush/stkCall.js";
import { callback } from "../../controllers/stkPush/stkController.js";

// authRoutes
// description on login the complete uri will be /authentication/v1/login
const route = Router();

route.post("/login", Login);
route.post("/reset", Reset);
route.post("/reset-email", verifyToken, Reset);
route.post("/otp/:regNo", OTPverification);
route.post("/log-out", verifyToken);
route.post("/refresh", refreshAccessToken);
route.post("/stk-push", verifyToken, stkCalls);
route.post("/stk-push-guest", stkGuestCalls);
route.get("/stk-push-status/:checkoutId", checkStatus);
route.post("/mpesa/callback", callback);
route.get("/mpesa/callback", callback);

export default route;
