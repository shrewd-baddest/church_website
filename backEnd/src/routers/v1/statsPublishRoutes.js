import { Router } from "express";
import verifyToken from "../../middlewares/Tokens.js";
import {
  publishStats,
  getPublishedComparison,
  getPublishedMemberProgress,
  getPublishedJumuiyaDashboard,
} from "../../controllers/statsPublishController.js";

const router = Router();

// Admin-triggered publish (requires auth)
router.post("/publish-stats", verifyToken, publishStats);

// User-facing — read from published snapshots
router.get("/published/comparison", getPublishedComparison);
router.get("/published/member-progress", verifyToken, getPublishedMemberProgress);
router.get("/published/jumuiya-dashboard/:jumuiyaId", getPublishedJumuiyaDashboard);

export default router;
