import { logActivity } from "../services/activityLogService.js";

// Public / noise / sensitive flows that must never be recorded.
const SKIP_PREFIXES = [
  "/api/v1/authentication", "/api/v1/files", "/api/v1/payments",
  "/api/v1/stkpush", "/api/v1/hire", "/api/v1/questions",
  "/api/v1/assistant", "/api/v1/member/", "/api/v1/readings",
  "/api/v1/bible", "/api/v1/published", "/api/v1/gallery/teaser",
  "/api/v1/sse", "/api/v1/setup/admin",
];

const ACTION_VERB = {
  POST: "Created",
  PUT: "Updated",
  PATCH: "Updated",
  DELETE: "Deleted",
};

const ENTITY_LABELS = {
  officials: "official",
  members: "member",
  jumuiya: "jumuiya",
  suggestions: "suggestion",
  activities: "activity",
  weekly_activities: "weekly activity",
  "weekly-activities": "weekly activity",
  semester_activities: "semester activity",
  "semester-activities": "semester activity",
  bookings: "activity booking",
  attendance: "attendance tally",
  "jumuiya-attendance": "attendance register",
  "jumuiya-members": "jumuiya member",
  "jumuiya-officials": "jumuiya official",
  "jumuiya-tshirts": "jumuiya t-shirt",
  "group-officials": "group official",
  role: "role assignment",
  roles: "role",
  settings: "setting",
  gallery: "gallery item",
  projects: "project",
  products: "product",
  orders: "order",
  "hire-requests": "hire request",
  notifications: "notification",
  "category-cards": "category card",
  testimonials: "testimonial",
  "community-view": "community record",
  "admin/activities": "activity",
  announcements: "announcement",
  "slider-items": "slider item",
  "publish-stats": "published statistics",
  "whatsapp-links": "WhatsApp link",
};

// Higher-value jumuiya/attendance operations deserve precise labels.
const SPECIAL_ACTIONS = [
  { match: /\/jumuiya-members\/csa\/finalize\//, label: "Finalized member distribution", type: "member distribution" },
  { match: /\/jumuiya-members\/csa\/distribute$/, label: "Ran member distribution", type: "member distribution" },
  { match: /\/jumuiya-members\/csa\/submit-for-approval/, label: "Submitted distribution for approval", type: "member distribution" },
  { match: /\/jumuiya-members\/csa\/approvals\/.*\/batch-review/, label: "Batch-reviewed allocations", type: "member allocation" },
  { match: /\/jumuiya-members\/csa\/approvals\/.*\/review/, label: "Reviewed allocation", type: "member allocation" },
  { match: /\/jumuiya-members\/csa\/validate-members/, label: "Validated members", type: "member import" },
  { match: /\/jumuiya-members\/.*\/import-records\/.+/, label: "Updated import record", type: "import record" },
  { match: /\/jumuiya-members\/csa\/import-members/, label: "Imported members", type: "member import" },
  { match: /\/jumuiya-members\/.*\/flag$/, label: "Flagged member", type: "jumuiya member" },
  { match: /\/jumuiya-members\/.*\/unflag$/, label: "Unflagged member", type: "jumuiya member" },
  { match: /\/jumuiya-members\/.*\/csa-allocations/, label: "Managed allocations", type: "member allocation" },
  { match: /\/suggestions\/.*\/reply/, label: "Replied to suggestion", type: "suggestion" },
  { match: /\/suggestions\/.*\/category/, label: "Updated suggestion category", type: "suggestion" },
  { match: /\/suggestions\/.*\/request-unmask/, label: "Requested unmask for suggestion", type: "suggestion" },
  { match: /\/suggestions\/.*\/unmask.*\/respond/, label: "Responded to unmask request", type: "suggestion" },
  { match: /\/attendance\//, label: "Updated attendance tally", type: "attendance tally" },
  { match: /\/publish-stats/, label: "Published statistics", type: "statistics" },
  { match: /\/admin\/activities\/bookings\/\d+\/payment$/, label: "Recorded cash payment", type: "activity payment" },
  { match: /\/admin\/activities\/bookings\/\d+\/cancel$/, label: "Cancelled booking", type: "activity booking" },
  { match: /\/admin\/activities\/bookings/, label: "Created booking for member", type: "activity booking" },
  { match: /\/whatsapp-links/, label: "Updated WhatsApp group link", type: "WhatsApp link" },
  { match: /\/jumuiya-tshirts/, label: "Updated Jumuiya T-shirts", type: "jumuiya t-shirt" },
  { match: /\/gallery/, label: "Managed gallery", type: "gallery item" },
  { match: /\/announcements/, label: "Managed announcement", type: "announcement" },
  // Financial audit trail — every write to treasury records must be logged
  // with who/when so internal fraud or accidental loss is traceable.
  { match: /^\/table\/finance_ledger\/?\d*/, label: "Managed treasury ledger record", type: "treasury ledger record" },
  { match: /^\/table\/finance_budgets\/?\d*/, label: "Managed treasury budget tracker", type: "treasury budget" },
];

const isIdSegment = (seg) => /^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(seg);

const describe = (req, method) => {
  const path = (req.originalUrl || req.path || "")
    .replace(/^\/api(\/v1)?/, "")
    .replace(/\/$/, "")
    .split("?")[0];

  for (const spec of SPECIAL_ACTIONS) {
    if (spec.match.test(path)) {
      const verb = ACTION_VERB[method] || "Managed";
      let actionLabel = spec.label;
      if (method === "DELETE" && !actionLabel.toLowerCase().includes("delete") && !actionLabel.toLowerCase().includes("cancel")) {
        actionLabel = `Deleted ${spec.type}`;
      }
      return { action: actionLabel, entityType: spec.type, entityId: req._activityEntityId ?? null };
    }
  }

  const segments = path.split("/").filter(Boolean);
  const first = segments[0] || "record";
  const entityLabel = ENTITY_LABELS[first] || first.replace(/[-_]/g, " ");
  const lastSeg = segments[segments.length - 1];
  const entityId =
    req._activityEntityId ??
    (lastSeg && lastSeg !== first && isIdSegment(lastSeg) ? lastSeg : null);

  return {
    action: `${ACTION_VERB[method] || "Modified"} ${entityLabel}${entityId ? ` #${entityId}` : ""}`,
    entityType: entityLabel,
    entityId,
  };
};

/**
 * Audit middleware for the /api/v1 router.
 */
const activityLogger = (req, res, next) => {
  const method = (req.method || "").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

  // Capture the created record id so creates read as "Created <entity> #<id>".
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    try {
      if (body && typeof body === "object" && !req._activityEntityId) {
        const candidate = body.id ?? body.record?.id ?? body.recordId ?? body.data?.id;
        if (candidate != null) req._activityEntityId = String(candidate);
      }
    } catch { /* ignore */ }
    return originalJson(body);
  };

  res.on("finish", () => {
    try {
      if (res.statusCode >= 400) return;
      if (!req.user) return;
      const path = req.originalUrl || req.path || "";
      if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return;

      const { action, entityType, entityId } = describe(req, method);
      logActivity({
        actor: { ...req.user, ip: req.ip },
        action,
        entityType,
        entityId,
        details: {
          method,
          path,
          query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
        },
      }).catch(() => {});
    } catch { /* audit must never break the request */ }
  });

  next();
};

export default activityLogger;
