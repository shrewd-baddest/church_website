import { Router } from "express";
import verifyToken from "../middlewares/Tokens.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
  getTallyContext,
  getSession,
  getRecentStatus,
  saveSession,
  deleteSession,
  getAnalytics,
  exportAnalyticsExcel,
  getHistory,
  updateTally,
  listNovenas,
  createNovena,
  updateNovena,
  deleteNovena,
} from "../controllers/attendanceController.js";

const router = Router();

// Attendance tally & analytics is managed by the Jumuiya Coordinator role only.
router.use(verifyToken);
router.use(requireRole("jumuiya_coordinator"));

router.get("/tally-context", getTallyContext);
router.get("/recent-status", getRecentStatus);
router.get("/sessions", getSession);
router.post("/sessions", saveSession);
router.delete("/sessions/:date", deleteSession);
router.get("/analytics/export", exportAnalyticsExcel);
router.get("/analytics", getAnalytics);
router.get("/history", getHistory);
router.patch("/history/:date", updateTally);
router.get("/novena", listNovenas);
router.post("/novena", createNovena);
router.patch("/novena/:id", updateNovena);
router.delete("/novena/:id", deleteNovena);

export default router;
