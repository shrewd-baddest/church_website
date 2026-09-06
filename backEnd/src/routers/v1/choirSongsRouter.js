import { Router } from "express";
import verifyToken, { optionalAuth } from "../../middlewares/Tokens.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { ALL_COMMUNITY_ADMIN_ROLES } from "../../middlewares/communityScopes.js";
import { uploadChoirSong, uploadMemoryForOcr } from "../../Configs/multerStorageConfig.js";
import {
  getSongs,
  getCategoriesAndStats,
  getSongById,
  checkDuplicateSong,
  batchCreateSongs,
  extractLyricsOcr,
  createSong,
  updateSong,
  deleteSong,
  getProgrammes,
  toggleSongInProgramme,
} from "../../controllers/choirSongsController.js";

const router = Router();

const handleMulterSong = (req, res, next) => {
  if (req.is && !req.is("multipart/form-data")) {
    return next();
  }
  uploadChoirSong.fields([
    { name: "sheet_image", maxCount: 1 },
    { name: "additional_sheets", maxCount: 6 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || "File upload failed" });
    }
    next();
  });
};

const handleMulterOcr = (req, res, next) => {
  uploadMemoryForOcr.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 6 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || "Image upload failed for OCR" });
    }
    next();
  });
};

// Public routes (browse songs, view lyrics/sheet music, stats, synced programmes)
router.get("/programmes", optionalAuth, getProgrammes);
router.post(
  "/programmes/toggle",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  toggleSongInProgramme
);
router.get("/stats", optionalAuth, getCategoriesAndStats);
router.get("/check-duplicate", optionalAuth, checkDuplicateSong);
router.get("/", optionalAuth, getSongs);
router.get("/:id", optionalAuth, getSongById);

// Admin routes — Multilingual Smart OCR text extraction from uploaded image buffer
router.post(
  "/ocr-extract",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  handleMulterOcr,
  extractLyricsOcr
);

// Admin routes — Batch create multiple songs from one sheet
router.post(
  "/batch-create",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  handleMulterSong,
  batchCreateSongs
);

// Admin routes — Create, Update, Delete songs
router.post(
  "/",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  handleMulterSong,
  createSong
);

router.put(
  "/:id",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  handleMulterSong,
  updateSong
);

router.patch(
  "/:id",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  handleMulterSong,
  updateSong
);

router.delete(
  "/:id",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  deleteSong
);

export default router;
