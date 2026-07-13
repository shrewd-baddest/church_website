import { Router } from "express";
import verifyToken from "../../middlewares/Tokens.js";
import {
  submitSuggestion,
  getSuggestions,
  getMySuggestions,
  requestUnmask,
  getUnmaskRequest,
  respondUnmask,
  deleteSuggestion,
  revealAuthor,
  respondToSuggestion,
  updateSuggestionStatus,
  setSuggestionCategory,
  getBin,
  clearBinItem,
  clearAllBin,
} from "../../controllers/suggestionController.js";

const router = Router();

router.post("/suggestions", verifyToken, submitSuggestion);
router.get("/suggestions/mine", verifyToken, getMySuggestions);
router.get("/suggestions/admin", verifyToken, getSuggestions);

router.post("/suggestions/:id/request-unmask", verifyToken, requestUnmask);
router.get("/suggestions/unmask/:token", getUnmaskRequest);
router.post("/suggestions/unmask/:token/respond", respondUnmask);
router.get("/suggestions/:id/reveal", verifyToken, revealAuthor);
router.delete("/suggestions/:id", verifyToken, deleteSuggestion);

router.put("/suggestions/:id/respond", verifyToken, respondToSuggestion);
router.put("/suggestions/:id/status", verifyToken, updateSuggestionStatus);
router.put("/suggestions/:id/category", verifyToken, setSuggestionCategory);

/* ── Bin Routes (CSA Chair only — validated in controller) ─────── */
router.get("/suggestions/bin", verifyToken, getBin);
router.delete("/suggestions/bin/clear", verifyToken, clearAllBin);
router.delete("/suggestions/bin/:id", verifyToken, clearBinItem);

export default router;
