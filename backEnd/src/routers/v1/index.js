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
import communityViewRouter from "./communityViewRouter.js";
import sliderRoutes from "./sliderRoutes.js";
import activitiesPublicRouter from "./activitiesPublicRouter.js";
import activitiesAdminRouter from "./activitiesAdminRouter.js";
import { Router } from "express"
import verifyToken from "../../middlewares/Tokens.js"
import formsDistributionRouter from "./FormsDistributionRouter.js"
import jumuiyaMembersRouter from "../jumuiyaMembersRouter.js"
import jumuiyaDataRouter from "../jumuiyaDataRouter.js"


import ordersRouter from "./orders.router.js";
import stkPushRouter from "./stkPush.route.js";
const router = Router()
import paymentRouter from "./payment.router.js";
import jumuiyaMemberRouter from "./jumuiyaMemberRouter.js";
import settingsRouter from "./settingsRoutes.js";
import suggestionRoutes from "./suggestionRoutes.js";
import { roleManagementRouter } from "./roleManagementRouter.js";
import categoryCardsRouter from "./categoryCardsRoutes.js";
import hireAvailabilityRouter from "./hireAvailability.js";
import hireSubmitRouter from "./hireSubmit.js";
import hireStatusRouter from "./hireStatus.js";
import activityLogRouter from "../activityLogRouter.js";

router.use("/payments", verifyToken, paymentRouter);
router.use("/stkPush", stkPushRouter); // STK callbacks are validated structurally, auth applied inside


// Basic table routes
// Authentication & Users
router.use("/authentication", authRoutes);
router.use("/member", verifyToken, memberProgressRoute); // Kept: user-level route, NOT admin

// Features
router.use("/officials", officialsRouter);
router.use("/jumuiya-officials", jumuiyaOfficialsRouter);
router.use("/", galleryRouter); // handles /choir/gallery
router.use("/community-view", communityViewRouter);
router.use("/orders", ordersRouter);

// All routes below require a valid JWT token
router.use("/questions", verifyToken, QuestionsRoutes);
router.use("/files", verifyToken, uploadMedia);
router.use("/notifications", verifyToken, notificationRoutes);
router.use("/csa", verifyToken, JumuiComparisonRoutes);
router.use("/distribution", verifyToken, formsDistributionRouter);

// Slider and config endpoints for frontend banners
router.use("/", sliderRoutes);

// Activities (weekly/novena effective schedule = public read; management = admin-only)
router.use("/activities", activitiesPublicRouter);
router.use("/admin/activities", activitiesAdminRouter);


// Jumuiya Member Collection System
router.use("/jumuiya-members", jumuiyaMemberRouter);

// Category cards (home page card images)
router.use("/", categoryCardsRouter);

// System settings (hire admin numbers, etc.)
router.use("/settings", settingsRouter);

// Jumuiya members endpoints
router.use("/jumuiya-members", jumuiyaMembersRouter);

// Jumuiya data (full aggregated data with group_id)
router.use("/jumuiya-data", jumuiyaDataRouter);

// Role management
router.use("/", roleManagementRouter);

// Hire availability checking
router.use("/hire", hireAvailabilityRouter);

// Hire bulk submission
router.use("/hire", hireSubmitRouter);

// Hire status management & payment
router.use("/hire", hireStatusRouter);

// Activity logs (must be before generic tableApi catch-all)
router.use("/", activityLogRouter);

// Suggestions system
router.use("/", suggestionRoutes);

// Generic Table CRUD (should be last) — requires valid session token
router.use("/", verifyToken, tableApi);

export default router;
