// Single source of truth for /admin role-based access on the frontend.
// Keep in sync with the backend's requireRole.js OFFICIAL_ROLES / routers.

export const CHAIR_ROLE = "CSA_CHAIR";

// Union of every role that grants any access to the /admin area. A logged-in
// member holding none of these must never even see the admin shell.
const KNOWN_ADMIN_ROLES = new Set([
  CHAIR_ROLE,
  "JUMUIYA_COORDINATOR",
  "OS",
  "JUMUIYA_OS",
  "PROJECT_MANAGER",
  "INSTRUMENT_MANAGER",
  "TREASURER",
  "CSA_VICE_CHAIR",
  "LITURGIST",
  "CSA_SECRETARY",
  "JUMUIYA_CHAIRPERSON",
  "JUMUIYA_VICE_CHAIRPERSON",
  "JUMUIYA_SECRETARY",
  "CHOIR_CHAIRPERSON",
  "CHOIR_VICE_CHAIR",
  "CHOIR_VICE_SECRETARY",
  "CHOIR_SECRETARY",
  "CHOIR_TREASURER",
  "CHOIR_PROJECT_COORDINATOR",
  "CHOIR_MALE_REPRESENTATIVE",
  "CHOIR_FEMALE_REPRESENTATIVE",
  "ST_FRANCIS_CHAIR",
  "ST_FRANCIS_VICE_CHAIR",
  "ST_FRANCIS_SECRETARY",
  "ST_FRANCIS_TREASURER",
  "CHARISMATIC_CHAIR",
  "CHARISMATIC_VICE_CHAIR",
  "DANCE_CHAIR",
  "DANCE_VICE_CHAIR",
  "MENTORSHIP_CHAIR",
  "MENTORSHIP_VICE_CHAIR",
]);

// Ordered list of admin destinations used to redirect a user to their first
// reachable page when they land on a page they may not open.
export const ALL_ADMIN_PATHS = [
  "/admin/officials",
  "/admin/jumuiya-members",
  "/admin/attendance-tally",
  "/admin/announcements",
  "/admin/weekly-activities",
  "/admin/semester-activities",
  "/admin/gallery",
  "/admin/secretary-dashboard",
  "/admin/sacramentals-banners",
  "/admin/products",
  "/admin/orders",
  "/admin/hire-requests",
  "/admin/projects",
  "/admin/donations",
  "/admin/treasury",
  "/admin/suggestions",
  "/admin/devotions",
  "/admin/registered-members",
  "/admin/community-management",
  "/admin/activity-log",
  "/admin/whatsapp-links",
  "/admin/jumuiya-channels",
  "/admin/community-updates",
  "/admin/jumuiya-tshirts",
  "/admin/csa-tshirts",
  "/admin/bookings",
];

export const normalizeRoles = (role: unknown): string[] => {
  const roles = Array.isArray(role) ? role : role ? [role] : [];
  return roles.map((r) => String(r).toUpperCase().trim());
};

export const isChair = (roles: string[]): boolean => roles.includes(CHAIR_ROLE);

// Pages the CSA chair may NOT open even though the chair otherwise has
// universal admin access. They belong to specific officials only:
//   - /admin/attendance-tally  -> jumuiya coordinator
//   - /admin/secretary-dashboard -> jumuiya officials
const CHAIR_FORBIDDEN_PATHS = [
  "/admin/attendance-tally",
  "/admin/secretary-dashboard",
  "/admin/community-updates",
  "/admin/jumuiya-tshirts",
  "/admin/jumuiya-channels",
];

export const hasAnyAdminAccess = (roles: string[]): boolean =>
  roles.some((r) => KNOWN_ADMIN_ROLES.has(r));

// Which community-management modules each group role may see/edit.
// Module ids match hub_modules ids used by CommunityManager/CommunityDetailEditor.
const COMMUNITY_MODULES_BY_ROLE: Record<string, string[]> = {
  CHOIR_CHAIRPERSON: ["choir"],
  CHOIR_VICE_CHAIR: ["choir"],
  CHOIR_VICE_SECRETARY: ["choir"],
  CHOIR_SECRETARY: ["choir"],
  CHOIR_TREASURER: ["choir"],
  CHOIR_PROJECT_COORDINATOR: ["choir"],
  CHOIR_MALE_REPRESENTATIVE: ["choir"],
  CHOIR_FEMALE_REPRESENTATIVE: ["choir"],
  DANCE_CHAIR: ["dancers"],
  DANCE_VICE_CHAIR: ["dancers"],
  CHARISMATIC_CHAIR: ["charismatic"],
  CHARISMATIC_VICE_CHAIR: ["charismatic"],
  ST_FRANCIS_CHAIR: ["st-francis"],
  ST_FRANCIS_VICE_CHAIR: ["st-francis"],
  ST_FRANCIS_SECRETARY: ["st-francis"],
  ST_FRANCIS_TREASURER: ["st-francis"],
  MENTORSHIP_CHAIR: ["mentorship", "youth"], // mentorship community historically lives under both ids
  MENTORSHIP_VICE_CHAIR: ["mentorship", "youth"],
  JUMUIYA_COORDINATOR: ["our-jumuiyas"],
  JUMUIYA_CHAIRPERSON: ["our-jumuiyas"],
  JUMUIYA_VICE_CHAIRPERSON: ["our-jumuiyas"],
  JUMUIYA_OS: ["our-jumuiyas"],
};

/**
 * Returns the list of community module ids a user may access, or null when
 * unrestricted (CSA chair / universal admin). Empty array = no community access.
 */
export const getAllowedCommunityModules = (roles: string[]): string[] | null => {
  if (isChair(roles)) return null;
  const modules = new Set<string>();
  roles.forEach((role) => {
    (COMMUNITY_MODULES_BY_ROLE[role] || []).forEach((m) => modules.add(m));
  });
  return Array.from(modules);
};

export const getAllowedPrefixes = (roles: string[]): Set<string> => {
  const prefixes = new Set<string>();
  if (isChair(roles)) return prefixes;

  roles.forEach((role) => {
    switch (role) {
      case "JUMUIYA_COORDINATOR":
        prefixes.add("/admin/officials");
        prefixes.add("/admin/jumuiya-members");
        prefixes.add("/admin/attendance-tally");
        prefixes.add("/admin/activity-log");
        break;
      case "OS":
        prefixes.add("/admin/announcements");
        prefixes.add("/admin/weekly-activities");
        prefixes.add("/admin/semester-activities");
        prefixes.add("/admin/gallery");
        prefixes.add("/admin/bookings");
        break;
      case "JUMUIYA_OS":
        prefixes.add("/admin/secretary-dashboard");
        prefixes.add("/admin/jumuiya-members");
        prefixes.add("/admin/weekly-activities");
        prefixes.add("/admin/semester-activities");
        prefixes.add("/admin/whatsapp-links");
        prefixes.add("/admin/community-updates");
        prefixes.add("/admin/jumuiya-channels");
        break;
      case "PROJECT_MANAGER":
        prefixes.add("/admin/sacramentals-banners");
        prefixes.add("/admin/products");
        prefixes.add("/admin/orders");
        prefixes.add("/admin/hire-requests");
        prefixes.add("/admin/projects");
        break;
      case "INSTRUMENT_MANAGER":
        prefixes.add("/admin/projects");
        break;
      case "TREASURER":
        prefixes.add("/admin/donations");
        prefixes.add("/admin/treasury");
        break;
      case "CSA_VICE_CHAIR":
        prefixes.add("/admin/suggestions");
        prefixes.add("/admin/csa-tshirts");
        prefixes.add("/admin/projects");
        break;
      case "LITURGIST":
        prefixes.add("/admin/devotions");
        break;
      case "CSA_SECRETARY":
        prefixes.add("/admin/registered-members");
        prefixes.add("/admin/whatsapp-links");
        prefixes.add("/admin/treasury");
        break;
      case "JUMUIYA_CHAIRPERSON":
        prefixes.add("/admin/suggestions");
        prefixes.add("/admin/suggestion-bin");
        prefixes.add("/admin/secretary-dashboard");
        prefixes.add("/admin/jumuiya-members");
        prefixes.add("/admin/weekly-activities");
        prefixes.add("/admin/semester-activities");
        prefixes.add("/admin/community-updates");
        prefixes.add("/admin/jumuiya-tshirts");
        prefixes.add("/admin/jumuiya-channels");
        break;
      case "JUMUIYA_VICE_CHAIRPERSON":
        prefixes.add("/admin/community-updates");
        prefixes.add("/admin/jumuiya-tshirts");
        prefixes.add("/admin/suggestions");
        break;
      case "JUMUIYA_SECRETARY":
        prefixes.add("/admin/secretary-dashboard");
        prefixes.add("/admin/jumuiya-members");
        prefixes.add("/admin/community-updates");
        prefixes.add("/admin/jumuiya-channels");
        break;
      case "CHOIR_CHAIRPERSON":
      case "CHOIR_VICE_CHAIR":
      case "CHOIR_VICE_SECRETARY":
      case "CHOIR_SECRETARY":
      case "CHOIR_TREASURER":
      case "CHOIR_PROJECT_COORDINATOR":
      case "CHOIR_MALE_REPRESENTATIVE":
      case "CHOIR_FEMALE_REPRESENTATIVE":
        prefixes.add("/admin/community-management");
        prefixes.add("/admin/community-management/choir");
        break;
      case "ST_FRANCIS_CHAIR":
      case "ST_FRANCIS_VICE_CHAIR":
      case "ST_FRANCIS_SECRETARY":
      case "ST_FRANCIS_TREASURER":
        prefixes.add("/admin/community-management");
        prefixes.add("/admin/community-management/st-francis");
        break;
      case "CHARISMATIC_CHAIR":
      case "CHARISMATIC_VICE_CHAIR":
        prefixes.add("/admin/community-management");
        prefixes.add("/admin/community-management/charismatic");
        break;
      case "DANCE_CHAIR":
      case "DANCE_VICE_CHAIR":
        prefixes.add("/admin/community-management");
        prefixes.add("/admin/community-management/dancers");
        break;
      case "MENTORSHIP_CHAIR":
      case "MENTORSHIP_VICE_CHAIR":
        prefixes.add("/admin/community-management");
        prefixes.add("/admin/community-management/mentorship");
        break;
    }
  });

  return prefixes;
};

export const checkAccess = (roles: string[], path: string): boolean => {
  if (isChair(roles)) {
    return !CHAIR_FORBIDDEN_PATHS.some((forbidden) => path.startsWith(forbidden));
  }
  if (path === "/admin" || path === "/admin/") return false;

  const prefixes = getAllowedPrefixes(roles);
  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
};

// First reachable destination for a user who may not open the current page.
export const getFirstAllowedPath = (roles: string[]): string | null =>
  ALL_ADMIN_PATHS.find((p) => checkAccess(roles, p)) ?? null;
