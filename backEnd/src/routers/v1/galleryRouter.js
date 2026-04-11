import { Router } from "express";
import { getGallery, uploadToGallery, getGalleryTeaser, addComment, addReaction } from "../../controllers/galleryController.js";
import { uploadMiddleware } from "../../middlewares/uploadMiddleware.js";
import verifyToken from "../../middlewares/Tokens.js";
import optionalVerifyToken from "../../middlewares/optionalVerifyToken.js";

const router = Router();

// Public teaser (No login required)
router.get("/gallery/teaser", getGalleryTeaser);

// Full gallery (Optional token for Jumuiya-based filtering)
router.get("/gallery", optionalVerifyToken, getGallery); 

// Social interactions
router.post("/gallery/comment", verifyToken, addComment);
router.post("/gallery/reaction", verifyToken, addReaction);

// Generic and specific upload/fetch
router.get("/choir/gallery", getGallery); // Still public for now, but will follow getGallery logic
router.post("/choir/gallery", verifyToken, uploadMiddleware, uploadToGallery);
router.post("/gallery/upload", verifyToken, uploadMiddleware, uploadToGallery);

export default router;
