import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

// Build a module object from a db row + its related sub-data
const buildModule = (mod, officials, activities, gallery, announcements) => ({
  id: mod.id,
  title: mod.title,
  description: mod.description,
  path: `/community/${mod.id}`,
  color: mod.theme_color || '#2c3e50',
  icon: mod.icon_class || 'fas fa-users',
  scheduleLabel: mod.schedule_label,
  meetingSchedule: mod.training_time
    ? `${mod.training_time}${mod.location ? ' — ' + mod.location : ''}`
    : null,
  story: mod.story,
  fees: {
    registration: mod.registration_fee,
    subscription: mod.subscription_fee,
    uniform: mod.uniform_info,
  },
  officials: officials.rows.map(o => ({
    id: String(o.id),
    name: o.name,
    role: o.role,
    photoUrl: o.photo_url,
    email: o.email,
    phoneNumber: o.phone_number,
  })),
  activities: activities.rows.map(a => ({
    id: String(a.id),
    title: a.title,
    date: a.activity_date,
    description: a.description,
    status: a.status || 'Upcoming',
  })),
  gallery: gallery.rows.map(g => ({
    id: String(g.id),
    url: g.image_url,
    caption: g.description || g.event_name || '',
  })),
  announcements: announcements.rows.map(n => ({
    id: String(n.id),
    title: n.title,
    content: n.content,
    date: n.announcement_date,
  })),
});

/**
 * GET /community-view/data
 * Returns all hub modules enriched with related data.
 */
export const getCommunityModules = async (req, res) => {
  try {
    const modulesResult = await pool.query(
      `SELECT id, title, description, theme_color, icon_class, schedule_label,
              training_time, location, registration_fee, subscription_fee, uniform_info, story
       FROM hub_modules ORDER BY id`
    );

    if (modulesResult.rows.length === 0) {
      return res.json([]);
    }

    const modules = await Promise.all(
      modulesResult.rows.map(async (mod) => {
        const [officials, activities, gallery, announcements] = await Promise.all([
          pool.query(`SELECT * FROM hub_officials WHERE module_id = $1`, [mod.id]),
          pool.query(`SELECT * FROM hub_activities WHERE module_id = $1 ORDER BY activity_date DESC`, [mod.id]),
          pool.query(`SELECT * FROM hub_gallery WHERE module_id = $1`, [mod.id]),
          pool.query(`SELECT * FROM hub_announcements WHERE module_id = $1 ORDER BY announcement_date DESC`, [mod.id]),
        ]);
        return buildModule(mod, officials, activities, gallery, announcements);
      })
    );

    res.json(modules);
  } catch (error) {
    logger.error('Error fetching community modules: ' + error.message);
    res.status(500).json({ message: 'Failed to fetch community modules' });
  }
};

/**
 * GET /community-view/:moduleId
 * Returns a single hub module by ID with all its sub-data.
 */
export const getCommunityModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const modResult = await pool.query(
      `SELECT id, title, description, theme_color, icon_class, schedule_label,
              training_time, location, registration_fee, subscription_fee, uniform_info, story
       FROM hub_modules WHERE id = $1`,
      [moduleId]
    );

    if (modResult.rows.length === 0) {
      return res.status(404).json({ message: 'Community module not found' });
    }

    const mod = modResult.rows[0];

    const [officials, activities, gallery, announcements] = await Promise.all([
      pool.query(`SELECT * FROM hub_officials WHERE module_id = $1`, [mod.id]),
      pool.query(`SELECT * FROM hub_activities WHERE module_id = $1 ORDER BY activity_date DESC`, [mod.id]),
      pool.query(`SELECT * FROM hub_gallery WHERE module_id = $1`, [mod.id]),
      pool.query(`SELECT * FROM hub_announcements WHERE module_id = $1 ORDER BY announcement_date DESC`, [mod.id]),
    ]);

    res.json(buildModule(mod, officials, activities, gallery, announcements));
  } catch (error) {
    logger.error('Error fetching community module: ' + error.message);
    res.status(500).json({ message: 'Failed to fetch community module' });
  }
};
