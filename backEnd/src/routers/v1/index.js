import { api as tableApi } from "./api.js"
import authRoutes from "./Authorization.js"
import QuestionsRoutes from "./GenerateQuestions.js"
import uploadMedia from "./mediaRoutes.js"
import memberProgressRoute from "./getMemberProgress.js"
import JumuiComparisonRoutes from "./JumuiComparisonRoutes.js"
import notificationRoutes from "./notification.js"
import officialsRouter from "./officialsRouter.js";
import jumuiyaOfficialsRouter from "./jumuiyaOfficialsRouter.js";
import galleryRouter from "./galleryRouter.js";
import { Router } from "express"
import verifyToken from "../../middlewares/Tokens.js"

const router = Router()

// Basic table routes
// Authentication & Users
router.use("/authentication", authRoutes);
router.use("/member", verifyToken, memberProgressRoute);

// Features
router.use("/officials", officialsRouter);
router.use("/jumuiya-officials", jumuiyaOfficialsRouter);
router.use("/", galleryRouter); // handles /choir/gallery
router.use("/questions", verifyToken, QuestionsRoutes);
router.use("/files", verifyToken, uploadMedia);
router.use("/notifications", verifyToken, notificationRoutes);
router.use("/csa", verifyToken, JumuiComparisonRoutes);

// Generic Table CRUD (should be last)
router.use("/", tableApi);

export default router;