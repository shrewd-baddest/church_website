import { Router } from "express";
import verifyToken from "../../middlewares/Tokens.js";
import { authorize } from "../../middlewares/authorization.js";

import {
  // weekly
  createWeeklyActivity,
  updateWeeklyActivity,
  deleteWeeklyActivity,
  activateWeeklyActivity,
  deactivateWeeklyActivity,
  reorderWeeklyActivities,

  // novena schedules
  getNovenaSchedules,
  createNovenaSchedule,
  updateNovenaSchedule,
  deleteNovenaSchedule,
  activateNovenaSchedule,
  deactivateNovenaSchedule,

  // novena overrides
  getNovenaOverrides,
  createNovenaOverrideActivity,
  updateNovenaOverrideActivity,
  deleteNovenaOverrideActivity,
  reorderNovenaOverrides,

  // semester
  createSemesterActivity,
  updateSemesterActivity,
  deleteSemesterActivity,
  activateSemesterActivity,
  deactivateSemesterActivity,
} from "../../controllers/activitiesController.js";

import {
  getAllBookings,
  exportBookingsCSV,
} from "../../controllers/activityBookingController.js";

const router = Router();

// Permission resources/actions (standard lowercase convention)
const permission = (action, resource) => authorize(action, resource);
const requireAdmin = (action, resource) => [verifyToken, permission(action, resource)];

// ── Weekly (admin) ───────────────────────────────
router.post("/weekly", ...requireAdmin('create', 'weekly_activities'), createWeeklyActivity);
router.patch("/weekly/:id", ...requireAdmin('update', 'weekly_activities'), updateWeeklyActivity);
router.delete("/weekly/:id", ...requireAdmin('delete', 'weekly_activities'), deleteWeeklyActivity);

router.post(
  "/weekly/:id/activate",
  ...requireAdmin('activate', 'weekly_activities'),
  activateWeeklyActivity
);
router.post(
  "/weekly/:id/deactivate",
  ...requireAdmin('deactivate', 'weekly_activities'),
  deactivateWeeklyActivity
);

router.post(
  "/weekly/reorder",
  ...requireAdmin('reorder', 'weekly_activities'),
  reorderWeeklyActivities
);

// ── Semester (admin) ─────────────────────────────
router.post("/semester", ...requireAdmin('create', 'semester_activities'), createSemesterActivity);
router.patch("/semester/:id", ...requireAdmin('update', 'semester_activities'), updateSemesterActivity);
router.delete("/semester/:id", ...requireAdmin('delete', 'semester_activities'), deleteSemesterActivity);

router.post(
  "/semester/:id/activate",
  ...requireAdmin('activate', 'semester_activities'),
  activateSemesterActivity
);
router.post(
  "/semester/:id/deactivate",
  ...requireAdmin('deactivate', 'semester_activities'),
  deactivateSemesterActivity
);

// ── Novena schedules (admin) ─────────────────────
router.get(
  "/novena/schedules",
  ...requireAdmin('read', 'novena_schedules'),
  getNovenaSchedules
);
router.post(
  "/novena/schedules",
  ...requireAdmin('create', 'novena_schedules'),
  createNovenaSchedule
);
router.patch(
  "/novena/schedules/:id",
  ...requireAdmin('update', 'novena_schedules'),
  updateNovenaSchedule
);
router.delete(
  "/novena/schedules/:id",
  ...requireAdmin('delete', 'novena_schedules'),
  deleteNovenaSchedule
);
router.post(
  "/novena/schedules/:id/activate",
  ...requireAdmin('activate', 'novena_schedules'),
  activateNovenaSchedule
);
router.post(
  "/novena/schedules/:id/deactivate",
  ...requireAdmin('deactivate', 'novena_schedules'),
  deactivateNovenaSchedule
);

// ── Novena override activities (admin) ───────────
router.get(
  "/novena/overrides",
  ...requireAdmin('read', 'novena_override_activities'),
  getNovenaOverrides
);

router.post(
  "/novena/overrides",
  ...requireAdmin('create', 'novena_override_activities'),
  createNovenaOverrideActivity
);
router.patch(
  "/novena/overrides/:id",
  ...requireAdmin('update', 'novena_override_activities'),
  updateNovenaOverrideActivity
);
router.delete(
  "/novena/overrides/:id",
  ...requireAdmin('delete', 'novena_override_activities'),
  deleteNovenaOverrideActivity
);

router.post(
  "/novena/overrides/reorder",
  ...requireAdmin('reorder', 'novena_override_activities'),
  reorderNovenaOverrides
);

// ── Activity bookings (admin) ──────────────────────
// Frontend controls sidebar visibility; verifyToken is sufficient here.
router.get("/bookings", verifyToken, getAllBookings);
router.get("/bookings/export", verifyToken, exportBookingsCSV);

export default router;

