import { Router } from "express";
import { getCommunityModules, getCommunityModuleById } from "../../controllers/communityViewController.js";

const router = Router();

// GET all community modules with their sub-data
router.get("/data", getCommunityModules);

// GET a single community module by ID
router.get("/:moduleId", getCommunityModuleById);

export default router;
