import { Router } from "express";
import { getActivityLogs } from "../controllers/activityLogController.js";
import verifyToken from "../middlewares/Tokens.js";

const router = Router();

router.get("/activity-logs", verifyToken, getActivityLogs);

export default router;
