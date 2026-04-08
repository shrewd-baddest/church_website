import { BackendDataService } from '../services/backend-data.js';
import { db } from '../Configs/dbConfig.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Data fetched exclusively from PostgreSQL ───────────


export const getIndex = (_req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontEnd/src/pages/sacramental/pages/index.html'));
};

export const getHubData = async (_req, res) => {
    try {
        const result = await db.query('SELECT * FROM hub_modules');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No ministry modules found in database.' });
        }

        const modules = result.rows.map(m => ({
            ...m,
            path: m.path || `/hub-view/${m.id}`,
            color: m.theme_color,
            iconColor: m.icon_class === 'fas fa-music' ? 'var(--theme-primary)' : undefined,
            icon: m.icon_class
        }));
        res.json(modules);
    } catch (err) {
        console.error('[HubController] DB Fetch Error:', err.message);
        res.status(500).json({ error: 'Database connection error while fetching hub data.' });
    }
};

export const getModule = async (req, res) => {
    const id = req.params.moduleId || req.path.replace(/^\//, '');
    console.log(`[HubController] Module resolution attempt: ID="${id}"`);

    // Determine if it's a request for the page or just data
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        if (id === 'choir') {
            return res.sendFile(path.join(__dirname, '../../../frontEnd/src/pages/sacramental/pages/choir.html'));
        }
        return res.sendFile(path.join(__dirname, '../../../frontEnd/src/pages/sacramental/pages/module.html'));
    }

    try {
        // Fetch main module meta from DB
        const moduleResult = await db.query('SELECT * FROM hub_modules WHERE id = $1', [id]);
        
        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: `Module "${id}" not found.` });
        }

        const meta = moduleResult.rows[0];

        // Fetch related data in parallel
        const [officials, activities, announcements, gallery] = await Promise.all([
            db.query('SELECT * FROM hub_officials WHERE module_id = $1', [id]),
            db.query('SELECT * FROM hub_activities WHERE module_id = $1 ORDER BY activity_date DESC', [id]),
            db.query('SELECT * FROM hub_announcements WHERE module_id = $1 ORDER BY announcement_date DESC', [id]),
            db.query('SELECT * FROM hub_gallery WHERE module_id = $1', [id])
        ]);

        const moduleInfo = {
            id: meta.id,
            title: meta.title,
            description: meta.description,
            color: meta.theme_color,
            icon: meta.icon_class,
            scheduleLabel: meta.schedule_label,
            training: meta.training_time,
            location: meta.location,
            fees: {
                registration: meta.registration_fee,
                subscription: meta.subscription_fee,
                uniform: meta.uniform_info
            },
            story: meta.story,
            officials: officials.rows,
            activities: activities.rows.map(a => ({
                ...a,
                date: a.activity_date ? a.activity_date.toISOString().split('T')[0] : null
            })),
            announcements: announcements.rows,
            gallery: gallery.rows.map(g => ({
                ...g,
                imageUrl: g.image_url,
                eventName: g.event_name
            }))
        };

        res.json(moduleInfo);
    } catch (err) {
        console.error(`[HubController] DB Error for module ${id}:`, err.message);
        res.status(500).json({ error: `Database error while loading module "${id}".` });
    }
};



