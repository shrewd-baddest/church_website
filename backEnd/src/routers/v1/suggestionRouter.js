import { Router } from "express";
import {
  listSuggestions,
  getMySuggestions,
  getBin,
  softDelete,
  restoreFromBin,
  permanentDelete,
  clearBin,
  requestUnmask,
  getRoleUnmaskRequest,
  respondRoleUnmask,
  replyToSuggestion,
  updateSuggestionCategory,
} from "../../controllers/suggestionController.js";
import verifyToken from "../../middlewares/Tokens.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Roles allowed to manage the suggestion box. jumuiya_vice_chairperson is
// deliberately excluded from the generic OFFICIAL_ROLES set (global PII reads)
// but is still an allowed manager here.
const SUGGESTION_ADMIN_ROLES = [
  "csa_chair", "csa_vice_chair", "csa_secretary", "jumuiya_coordinator",
  "jumuiya_chairperson", "jumuiya_vice_chairperson",
];
const suggestionAdminGate = requireRole(...SUGGESTION_ADMIN_ROLES);
const suggestionBinViewGate = requireRole("csa_chair", "csa_vice_chair", "jumuiya_chairperson", "jumuiya_vice_chairperson");
const suggestionBinDeleteGate = requireRole("csa_chair", "jumuiya_chairperson");

router.get("/mine", verifyToken, getMySuggestions);
router.get("/", verifyToken, suggestionAdminGate, listSuggestions);

router.get("/bin", verifyToken, suggestionBinViewGate, getBin);
router.patch("/bin/:id/restore", verifyToken, suggestionBinViewGate, restoreFromBin);
router.delete("/bin/clear", verifyToken, suggestionBinDeleteGate, clearBin);
router.delete("/bin/:id", verifyToken, suggestionBinDeleteGate, permanentDelete);

router.get("/unmask/:role/:token", getRoleUnmaskRequest);
router.post("/unmask/:role/:token/respond", respondRoleUnmask);

router.post("/:id/reply", verifyToken, suggestionAdminGate, replyToSuggestion);
router.patch("/:id/category", verifyToken, suggestionAdminGate, updateSuggestionCategory);
router.post("/:id/request-unmask", verifyToken, suggestionAdminGate, requestUnmask);
router.delete("/:id", verifyToken, suggestionAdminGate, softDelete);

export default router;
