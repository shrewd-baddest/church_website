import { db } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

// Keys that are safe to expose publicly. system_settings is used for
// operational values; anything not listed here is withheld from unauthenticated
// clients so a future admin who stores a secret here does not leak it.
const PUBLIC_SAFE_KEYS = new Set([
  "cash_phone",
  "chairs_handler_phone",
  "instruments_handler_phone",
  "hire_admin_phone",
  "hire_pickup_location",
  "hire_pickup_instructions",
  "developer_team",
  "schema_version",
  "explore_jumuiya_image",
  "community_jumuiya_image",
  "community_jumuiyas_image",
  "explore_activities_image",
  "explore_projects_image",
  "explore_officials_image",
  "explore_background_image",
  "gallery_items",
  "semester_default_image",
  "hero_dynamic_enabled",
]);

// Keys that the settings write endpoint will accept. Anything else is dropped,
// so an official cannot inject arbitrary operational values (or overwrite a
// secret someone stored here) through the generic PUT /settings endpoint.
const WRITE_ALLOWED_KEYS = new Set([
  "cash_phone",
  "chairs_handler_phone",
  "instruments_handler_phone",
  "hire_admin_phone",
  "hire_pickup_location",
  "hire_pickup_instructions",
  "developer_team",
  "explore_jumuiya_image",
  "community_jumuiya_image",
  "community_jumuiyas_image",
  "explore_activities_image",
  "explore_projects_image",
  "explore_officials_image",
  "explore_background_image",
  "gallery_items",
  "semester_default_image",
  "hero_dynamic_enabled",
]);

// GET all settings — only public-safe keys are returned to anonymous clients.
export const getSettings = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM system_settings ORDER BY key`);
    // Convert array to object: { key: value }, withholding non-public keys.
    const settings = {};
    result.rows.forEach(row => {
      if (PUBLIC_SAFE_KEYS.has(row.key)) settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    logger.error("Error fetching settings:", error.message);
    res.status(500).json({ error: "Failed to load settings" });
  }
};

// PUT update settings (bulk)
export const updateSettings = async (req, res) => {
  try {
    const settings = req.body; // { key: value, key2: value2 }
    
    for (const [key, value] of Object.entries(settings)) {
      if (!WRITE_ALLOWED_KEYS.has(key)) continue;
      await db.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    logger.info("Settings updated:", Object.keys(settings).join(", "));
    res.json({ success: true, message: "Settings saved" });
  } catch (error) {
    logger.error("Error updating settings:", error.message);
    res.status(500).json({ error: "Failed to save settings" });
  }
};

/**
 * POST /settings/upload-explore
 * Accepts a single image file (via the uploadExploreImage multer middleware)
 * and returns its Cloudinary URL. The image is processed with landscape
 * transformations (900×500, fill, gravity:auto) suitable for card headers.
 */
export const uploadExploreCardImage = (req, res) => {
  const file = req.file || req.files?.[0];
  if (!file) {
    return res.status(400).json({ error: "No image file provided" });
  }
  // multer's Cloudinary storage sets file.path to the secure_url
  const url = file.path;
  if (!url) {
    return res.status(500).json({ error: "Upload succeeded but no URL was returned" });
  }
  logger.info(`Explore card image uploaded: ${url}`);
  res.json({ success: true, data: { url } });
};

