import { db } from "../Configs/dbConfig.js";

const GLOBAL_ROLES = ["csa_secretary", "csa_chair", "jumuiya_coordinator"];

// Any approved official may manage the member/role directory, orders, payments
// and other admin surfaces. Shared across routers that gate admin endpoints.
// NOTE: jumuiya_vice_chairperson is intentionally NOT here — that role manages
// only its own jumuiya's suggestion box (see suggestionRouter) and must not get
// global PII / order / payment reads.
const OFFICIAL_ROLES = [
  "csa_chair", "csa_vice_chair", "csa_secretary", "project_manager",
  "instrument_manager", "os", "treasurer", "liturgist", "choir_chairperson",
  "jumuiya_coordinator", "jumuiya_chairperson", "jumuiya_os", "jumuiya_secretary",
  "choir_secretary", "choir_vice_secretary", "choir_treasurer", "choir_project_coordinator",
  "choir_male_representative", "choir_female_representative", "choir_vice_chair",
  "dance_chair", "dance_vice_chair",
  "charismatic_chair", "charismatic_vice_chair",
  "st_francis_chair", "st_francis_vice_chair", "st_francis_secretary", "st_francis_treasurer",
  "mentorship_chair", "mentorship_vice_chair",
];

const getUserRoles = (req) => {
  if (!req.user) return [];
  return Array.isArray(req.user.role)
    ? req.user.role
    : req.user.role ? [req.user.role] : [];
};

// True when the (optionally authenticated) caller holds any official role.
// Used by controllers to decide whether to include sensitive fields such as
// member reg_numbers in public GET responses.
const isOfficial = (req) =>
  getUserRoles(req).some(r => OFFICIAL_ROLES.includes(String(r).toLowerCase().trim()));

const requireRole = (...allowedRoles) => {
  const allowed = allowedRoles.map(r => String(r).toLowerCase().trim());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const hasAccess = getUserRoles(req).some(r => allowed.includes(String(r).toLowerCase().trim()));
    if (!hasAccess) {
      // Deliberately 404, not 403: an authenticated-but-unauthorized caller must
      // not be able to distinguish "this admin endpoint exists" from "nothing
      // here", so probes can't enumerate protected routes by status code.
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    next();
  };
};

// Normalize jumuiya identifiers for comparison (ignores case, dots, hyphens)
const normalizeKey = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Enforce that jumuiya-scoped users can only act on their own jumuiya.
// getTargetJumuiyaId receives the req object and returns the jumuiya_id being
// acted on. Targets may be a UUID, a slug (e.g. "st-anthony"), or a name — the
// middleware resolves slugs/names to group_id before comparing to the token.
const enforceJumuiyaScope = (getTargetJumuiyaId) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
    const isGlobal = getUserRoles(req).some(r => GLOBAL_ROLES.includes(String(r).toLowerCase().trim()));
    if (isGlobal) return next();
    const targetId = getTargetJumuiyaId(req);
    const ownId = req.user.jumuiya_id;
    if (!targetId || !ownId) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    if (normalizeKey(targetId) === normalizeKey(ownId)) return next();
    // Target may be a slug or name — resolve to group_id and compare
    // (group_id is a UUID column, so it must be cast to text before lower()).
    const { rows } = await db.query(
      "SELECT group_id FROM sub_groups WHERE LOWER(slug) = $1 OR LOWER(group_id::text) = $1 OR LOWER(name) = $1",
      [String(targetId).toLowerCase()]
    );
    if (rows.length > 0 && normalizeKey(rows[0].group_id) === normalizeKey(ownId)) return next();
    // 404 so a scoped user cannot discover whether another jumuiya/route exists.
    return res.status(404).json({ success: false, message: "Resource not found" });
  } catch (error) {
    return res.status(404).json({ success: false, message: "Resource not found" });
  }
};

export { requireRole, enforceJumuiyaScope, isOfficial, OFFICIAL_ROLES };
export default requireRole;
