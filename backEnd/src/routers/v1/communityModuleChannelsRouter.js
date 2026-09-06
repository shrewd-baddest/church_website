import { Router } from "express";
import verifyToken from "../../middlewares/Tokens.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  ALL_COMMUNITY_ADMIN_ROLES,
  requireCommunityModuleScope,
} from "../../middlewares/communityScopes.js";
import {
  getCommunityModuleChannels,
  updateCommunityModuleChannels,
} from "../../controllers/communityModuleChannelsController.js";

const router = Router();

// Public: get channels for a community module (filtered on frontend or backend)
router.get(
  "/:moduleId/channels",
  getCommunityModuleChannels
);

// Admin: update channels for a community module
// Scoped so community leaders (e.g. dance_chair, choir_chairperson) can only
// manage their own community's channels; global CSA leadership has cross-community access.
router.patch(
  "/:moduleId/channels",
  verifyToken,
  requireRole(...ALL_COMMUNITY_ADMIN_ROLES),
  requireCommunityModuleScope,
  updateCommunityModuleChannels
);

export default router;
