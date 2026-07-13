import { Router } from "express";
import verifyToken from "../../middlewares/Tokens.js";
import {
  submitSuggestion,
  getSuggestions,
  requestUnmask,
  getUnmaskRequest,
  respondUnmask,
  deleteSuggestion,
  revealAuthor,
} from "../../controllers/suggestionController.js";

const router = Router();

// Public suggestion submission (authenticated users)
router.post("/suggestions", verifyToken, submitSuggestion);

// Get all suggestions for admin
router.get("/suggestions/admin", verifyToken, getSuggestions);

// VC requests unmask
router.post("/suggestions/:id/request-unmask", verifyToken, requestUnmask);

// Load unmask info (no token required — link from email)
router.get("/suggestions/unmask/:token", getUnmaskRequest);

// Submit approve/reject
router.post("/suggestions/unmask/:token/respond", respondUnmask);

// Reveal author after both approvals
router.get("/suggestions/:id/reveal", verifyToken, revealAuthor);

// Delete suggestion
router.delete("/suggestions/:id", verifyToken, deleteSuggestion);

export default router;
