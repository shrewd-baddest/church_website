import { Router } from "express";
import { getSettings, updateSettings, uploadExploreCardImage } from "../../controllers/settings.controller.js";
import { getSemester, setSemester } from "../../controllers/semesterConfigController.js";
import verifyToken from "../../middlewares/Tokens.js";
import { requireRole, OFFICIAL_ROLES } from "../../middlewares/requireRole.js";
import { uploadExploreImage } from "../../Configs/multerStorageConfig.js";

const router = Router();

// GET all settings (public read — only operational values, no secrets)
router.get("/", getSettings);

// PUT update settings (officials only)
router.put("/", verifyToken, requireRole(...OFFICIAL_ROLES), updateSettings);

// POST upload a community card image (landscape 900×500) and return the Cloudinary URL.
// The admin then saves the returned URL via PUT /settings.
router.post(
  "/upload-explore",
  verifyToken,
  requireRole(...OFFICIAL_ROLES),
  uploadExploreImage.single("file"),
  uploadExploreCardImage
);

// Current semester window (drives tally windows, member registration, meeting-day schedule).
// Public read so any role can display the window; writes are CSA chair only.
router.get("/semester", getSemester);
router.put("/semester", verifyToken, requireRole("csa_chair"), setSemester);

export default router;

