import { Router } from "express";
import v1Routes from "./v1/index.js";

const router = Router();

// Primary API Versions
router.use("/v1", v1Routes);

// Backward compatibility for non-versioned routes
router.use("/", v1Routes);

export default router;


