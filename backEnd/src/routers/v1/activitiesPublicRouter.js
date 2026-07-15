import { Router } from "express";
import verifyToken from "../../middlewares/Tokens.js";
import {
  getWeeklyActivities,
  getSemesterActivities,
  getEffectiveWeeklySchedule,
} from "../../controllers/activitiesController.js";
import {
  bookActivity,
  payBooking,
  mpesaCallback,
  getMyBookings,
} from "../../controllers/activityBookingController.js";

const router = Router();

// ─────────────────────────────
// Public read-only endpoints
// ─────────────────────────────

router.get("/schedule", getEffectiveWeeklySchedule);
router.get("/weekly", getWeeklyActivities);
router.get("/semester", getSemesterActivities);

// ─────────────────────────────
// Booking (authenticated users)
// ─────────────────────────────

router.post("/book", verifyToken, bookActivity);
router.post("/book/:id/pay", verifyToken, payBooking);
router.get("/my-bookings", verifyToken, getMyBookings);

// ─────────────────────────────
// M-Pesa callback (no auth)
// ─────────────────────────────

router.post("/bookings/callback/:id", mpesaCallback);

export default router;