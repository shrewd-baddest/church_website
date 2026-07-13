import { Router } from "express";
import { Login, refreshAccessToken, firstLoginSetup, verifyEmail, resendVerification } from "../../controllers/Login.js";
import { OTPverification, Reset } from "../../controllers/Reset.js";
import verifyToken from "../../middlewares/Tokens.js";
import {
  stkCalls,
  stkGuestCalls,
  checkStatus,
} from "../../controllers/stkPush/stkCall.js";
import { handleCallback as callback } from "../../controllers/stkPush/stkController.js";

import {
  assignPermissionsToRole,
  deleteAllMembers,
  getPermissionsByRole,
  getRolesAndPermissions,
  getUserRolesAndPermissions,
  listAllMembers,
  listAllUsersRolesPermissions,
  registerPermissions,
  registerRoles,
  registerUser,
  updateUserRoles,
} from "../../controllers/roles-permisions/roles_permissions.js";
import {
  assignRolePermissionValidator,
  registerPermissionValidator,
  registerRoleValidator,
} from "../../validators/index.js";
import { validate } from "../../middlewares/validateRequestBody.js";
import { payAndWait } from "../../controllers/stkPush/stkHelper.js";

// authRoutes
// description on login the complete uri will be /authentication/v1/login
const route = Router();

route.post("/login", Login);
route.post("/first-login-setup", firstLoginSetup);
route.post("/verify-email", verifyEmail);
route.post("/resend-verification", resendVerification);
route.post("/reset", Reset);
route.post("/reset-email", verifyToken, Reset);
route.post("/otp/:regNo", OTPverification);
// route.post("/log-out", verifyToken, logOut);
route.post("/refresh", refreshAccessToken);
route.post("/stk-push", verifyToken, stkCalls);
route.post("/stk-push-guest", stkGuestCalls);
route.get("/stk-push-status/:checkoutId", checkStatus);
route.post("/mpesa/callback", callback);
route.get("/mpesa/callback", callback);

// ── Admin-only system setup routes (require a valid token) ───────────────────
route.post("/register", verifyToken, registerUser);
route.post("/roles", verifyToken, registerRoleValidator, validate, registerRoles);
route.post(
  "/permissions",
  verifyToken,
  registerPermissionValidator,
  validate,
  registerPermissions,
);
route.post(
  "/role-permissions",
  verifyToken,
  assignRolePermissionValidator,
  validate,
  assignPermissionsToRole,
);

// function for admin to manage roles and permissions
route.get("/list-roles-permissions", verifyToken, getRolesAndPermissions);
route.get("/list-permissions-by-role", verifyToken, getPermissionsByRole);
route.get("/users-role-permissions", verifyToken, getUserRolesAndPermissions);
route.get("/list-all-memebrs-roles-permisions", verifyToken, listAllUsersRolesPermissions);
route.get("/list-all-memebrs", verifyToken, listAllMembers);
route.get("/delete-all-memebers", verifyToken, deleteAllMembers);
route.post("/update-user-roles", verifyToken, updateUserRoles);

export default route;
