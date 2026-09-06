import { api as tableApi } from "./api.js"
import authRoutes from "./Authorization.js"
import QuestionsRoutes from "./GenerateQuestions.js"
import uploadMedia from "./mediaRoutes.js"
import memberProgressRoute from "./getMemberProgress.js"
import JumuiComparisonRoutes from "./JumuiComparisonRoutes.js"
import notificationRoutes from "./notification.js"
import officialsRouter from "./officialsRouter.js";
import jumuiyaOfficialsRouter from "./jumuiyaOfficialsRouter.js";
import groupOfficialsRouter from "./groupOfficialsRouter.js";
import galleryRouter from "./galleryRouter.js";
import communityViewRouter from "./communityViewRouter.js";
import sliderRoutes from "./sliderRoutes.js";
import activitiesPublicRouter from "./activitiesPublicRouter.js";
import activitiesAdminRouter from "./activitiesAdminRouter.js";
import jumuiyaActivitiesRouter from "./jumuiyaActivitiesRouter.js";
import { Router } from "express"
import verifyToken from "../../middlewares/Tokens.js"
import activityLogger from "../../middlewares/activityLogger.js"
import jumuiyaMembersRouter from "../jumuiyaMembersRouter.js"
import jumuiyaDataRouter from "../jumuiyaDataRouter.js"
import attendanceRouter from "../attendanceRouter.js"
import jumuiyaAttendanceRouter from "../jumuiyaAttendanceRouter.js"


import ordersRouter from "./orders.router.js";
import testimonialsRouter from "./testimonialsRoutes.js";
import stkPushRouter from "./stkPush.route.js";
const router = Router()
import paymentRouter from "./payment.router.js";
import jumuiyaMemberRouter from "./jumuiyaMemberRouter.js";
import jumuiyaSelfRegisterRouter from "./jumuiyaSelfRegisterRouter.js";
import settingsRouter from "./settingsRoutes.js";
import { roleManagementRouter } from "./roleManagementRouter.js";
import readingsRouter from "./readingsRoutes.js";
import categoryCardsRouter from "./categoryCardsRoutes.js";
import hireAvailabilityRouter from "./hireAvailability.js";
import hireSubmitRouter from "./hireSubmit.js";
import hireStatusRouter from "./hireStatus.js";
import statsPublishRoutes from "./statsPublishRoutes.js";
import weeklyChallengeRoutes from "./weeklyChallengeRoutes.js";
import suggestionRouter from "./suggestionRouter.js";
import bibleRouter from "./bibleRoutes.js";
import assistantRoutes from "./assistantRoutes.js";
import activityLogRouter from "./activityLogRouter.js";
import purchaseReceiptsRouter from "./purchaseReceipts.js";
import whatsappLinksRouter from "./whatsappLinksRoutes.js";
import profileRoutes from "./profileRoutes.js";
import practiceSchedulesRouter from "./practiceSchedulesRouter.js";
import communityTshirtsRouter from "./communityTshirtsRouter.js";
import communityModuleChannelsRouter from "./communityModuleChannelsRouter.js";
import communityEnrollmentRouter from "./communityEnrollmentRouter.js";
import jumuiyaNotificationsRouter from "./jumuiyaNotificationsRouter.js";
import serialConfigRouter from "./serialConfigRouter.js";
import jumuiyaTshirtsRouter from "./jumuiyaTshirtsRouter.js";
import treasuryRouter from "./treasuryRoutes.js";
import productReviewsRouter from "./productReviewsRoutes.js";
import choirSongsRouter from "./choirSongsRouter.js";
import { getHeroSlides } from "../../controllers/heroSlidesController.js";

// Audit trail: records every authenticated admin mutation (who/what/when).
// Mounted first so it wraps every request in this router; it only writes on
// res 'finish' once req.user has been populated by the route's own auth.
router.use(activityLogger);

router.use("/payments", paymentRouter);
router.use("/stkPush", stkPushRouter);


// Basic table routes
// Authentication & Users
router.use("/authentication", authRoutes);
router.use("/member", verifyToken, memberProgressRoute); // Kept: user-level route, NOT admin

// Site assistant (public chat helper) - mounted early, before catch-all table CRUD
router.use("/assistant", assistantRoutes);

// Features
router.use("/officials", officialsRouter);
router.use("/jumuiya-officials", jumuiyaOfficialsRouter);
router.use("/group-officials", groupOfficialsRouter);
router.use("/", galleryRouter); // handles /choir/gallery
router.use("/community-view", communityViewRouter);
router.use("/orders", ordersRouter);

router.use("/questions", verifyToken, QuestionsRoutes);
router.use("/files", verifyToken, uploadMedia);
router.use("/notifications", notificationRoutes);
router.use("/csa", verifyToken, JumuiComparisonRoutes);
// Slider and config endpoints for frontend banners
router.use("/", sliderRoutes);

// Activities (weekly/novena effective schedule = public read; management = admin-only)
router.use("/activities", activitiesPublicRouter);
router.use("/admin/activities", activitiesAdminRouter);
router.use("/jumuiya-activities", jumuiyaActivitiesRouter);


// Public Dynamic WhatsApp Self-Registration (no auth required)
router.use("/jumuiya", jumuiyaSelfRegisterRouter);

// Jumuiya Member Collection System (auth: member PII + management writes)
router.use("/jumuiya-members", verifyToken, jumuiyaMemberRouter);

// Category cards (home page card images)
router.use("/", categoryCardsRouter);

// System settings (hire admin numbers, etc.)
router.use("/settings", settingsRouter);

// Admin audit log (CSA chair + jumuiya coordinator only)
router.use("/activity-logs", activityLogRouter);

// Jumuiya members endpoints (auth: member PII + management writes)
router.use("/jumuiya-members", verifyToken, jumuiyaMembersRouter);

// Attendance tally & analytics (Jumuiya Coordinator)
router.use("/attendance", attendanceRouter);

// Per-member attendance register (Jumuiya Secretary)
router.use("/jumuiya-attendance", jumuiyaAttendanceRouter);

// Jumuiya data (full aggregated data with group_id)
router.use("/jumuiya-data", jumuiyaDataRouter);

// Role management
router.use("/", roleManagementRouter);

// Setup — locked behind SETUP_ADMIN_ENABLED env flag to prevent unauthorized admin creation
router.post("/setup/admin", (req, res, next) => {
  if (process.env.SETUP_ADMIN_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Admin setup is not enabled' });
  }
  next();
}, async (req, res) => {
  const { setupAdmin } = await import("../../controllers/setupController.js");
  return setupAdmin(req, res);
});

// Hire availability checking
router.use("/hire", hireAvailabilityRouter);

// Hire bulk submission
router.use("/hire", hireSubmitRouter);

// Hire status management & payment
router.use("/hire", hireStatusRouter);

// Testimonials (dedicated routes for rating+reference validation)
router.use("/", testimonialsRouter);

// Stats publish (admin trigger + user-facing published endpoints)
router.use("/", statsPublishRoutes);

// Weekly challenge (member current + liturgist build/review/publish)
router.use("/weekly-challenge", verifyToken, weeklyChallengeRoutes);

// Suggestion-specific routes (bin, unmask, soft-delete)
router.use("/suggestions", suggestionRouter);

// Daily readings (USCCB proxy)
router.use("/", readingsRouter);

// Bible reader
router.use("/", bibleRouter);

// Purchase receipts (guest-friendly "notifications bay" data source)
router.use("/purchase-receipts", purchaseReceiptsRouter);

// WhatsApp group links (user-scoped fetch + admin management)
router.use("/whatsapp-links", whatsappLinksRouter);
// Treasury: OCR scan of written/printed records pages (officials)
router.use("/treasury", treasuryRouter);
// User profile (self-service get + update)
router.use("/profile", profileRoutes);

// Community practice schedules + tshirt orders + enrollments + channels
router.use("/practice-schedules", practiceSchedulesRouter);
router.use("/community-tshirts", communityTshirtsRouter);
router.use("/community-channels", communityModuleChannelsRouter);
router.use("/community-enrollment", communityEnrollmentRouter);
router.use("/jumuiya-notifications", jumuiyaNotificationsRouter);
router.use("/serial-config", serialConfigRouter);
router.use("/jumuiya-tshirts", jumuiyaTshirtsRouter);
router.use("/choir-songs", choirSongsRouter);
router.use("/choir_songs", choirSongsRouter);
router.get("/hero-slides", getHeroSlides);

// Product reviews
router.use("/", productReviewsRouter);

// Generic Table CRUD (should be last)
router.use("/", tableApi);

export default router;
