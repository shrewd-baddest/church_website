import { Router } from "express";
import { getGallery, uploadToGallery } from "../../controllers/galleryController.js";
import { uploadMiddleware } from "../../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/choir/gallery", getGallery);
router.post("/choir/gallery", uploadMiddleware, uploadToGallery);

export default router;
