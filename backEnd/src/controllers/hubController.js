import { BackendDataService } from '../services/backend-data.js';
import { db } from '../Configs/dbConfig.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Data fetched exclusively from PostgreSQL ───────────


export const getIndex = (_req, res) => {
    const indexPath = path.resolve(__dirname, '../../../frontEnd/src/pages/sacramental/pages/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('[HubController] Error sending index.html:', err);
            if (!res.headersSent) {
                res.status(500).send('Error loading community hub page. Please ensure front-end is built.');
            }
        }
    });
};

export const getHubData = async (_req, res) => {
    try {
        // Safe check: verify DB pool exists and is reachable
        if (!db) {
            throw new Error('Database configuration missing');
        }

        const result = await db.query('SELECT * FROM hub_modules').catch(err => {
            console.error('[HubController] Query Failed:', err.message);
            return { rows: [] }; // Return empty rows to prevent crash
        });

        if (!result.rows || result.rows.length === 0) {
            // If DB is empty or fails, we don't return 404/500 here to avoid breaking frontend.
            // We return an empty array and let the frontend use its fallback.
            return res.json([]);
        }

        const modules = result.rows.map(m => ({
            ...m,
            path: m.path || `/hub-view/${m.id}`,
            color: m.theme_color,
            iconColor: m.icon_class === 'fas fa-music' ? 'var(--theme-primary)' : undefined,
            icon: m.icon_class
        }));
        
        return res.status(200).json(modules);
    } catch (err) {
        console.error('[HubController] Critical error in getHubData:', err);
        return res.status(500).json({ 
            error: 'Server error while fetching hub data', 
            details: err.message,
            fallback: true 
        });
    }
};

export const getModule = async (req, res) => {
    const id = req.params.moduleId || req.path.replace(/^\//, '');
    
    // Explicit safety for text/html requests
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        try {
            const pageDir = '../../../frontEnd/src/pages/sacramental/pages';
            const pageName = id === 'choir' ? 'choir.html' : 'module.html';
            const pagePath = path.resolve(__dirname, pageDir, pageName);
            
            return res.sendFile(pagePath, (err) => {
                if (err && !res.headersSent) {
                    console.error(`[HubController] Failed to serve HTML for ${id}:`, err.message);
                    res.status(200).send('<!-- Falling back to client-side rendering -->');
                }
            });
        } catch (e) {
            return res.status(200).send(''); 
        }
    }

    try {
        if (!db) throw new Error('DB connection not initialized');

        // Fetch main module meta from DB
        const moduleResult = await db.query('SELECT * FROM hub_modules WHERE id = $1', [id]);
        
        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: `Module "${id}" not found.`, isMissing: true });
        }

        const meta = moduleResult.rows[0];

        // Fetch related data in parallel with per-query catch to avoid total failure
        const [officials, activities, announcements, gallery, schedules, classes] = await Promise.all([
            db.query('SELECT * FROM hub_officials WHERE module_id = $1', [id]).catch(() => ({ rows: [] })),
            db.query('SELECT * FROM hub_activities WHERE module_id = $1 ORDER BY activity_date DESC', [id]).catch(() => ({ rows: [] })),
            db.query('SELECT * FROM hub_announcements WHERE module_id = $1 ORDER BY announcement_date DESC', [id]).catch(() => ({ rows: [] })),
            db.query('SELECT * FROM hub_gallery WHERE module_id = $1', [id]).catch(() => ({ rows: [] })),
            db.query('SELECT * FROM hub_schedules WHERE module_id = $1', [id]).catch(() => ({ rows: [] })),
            db.query('SELECT * FROM hub_music_classes WHERE module_id = $1', [id]).catch(() => ({ rows: [] }))
        ]);

        const moduleInfo = {
            id: meta.id,
            title: meta.title || 'Untitled Module',
            description: meta.description || '',
            color: meta.theme_color || '#3b82f6',
            icon: meta.icon_class || 'fas fa-users',
            scheduleLabel: meta.schedule_label || 'Schedule',
            training: meta.training_time,
            location: meta.location,
            fees: {
                registration: meta.registration_fee || 0,
                subscription: meta.subscription_fee || 0,
                uniform: meta.uniform_info
            },
            story: meta.story,
            officials: officials.rows,
            activities: activities.rows.map(a => {
                let formattedDate = null;
                try {
                    if (a.activity_date) {
                        const d = new Date(a.activity_date);
                        if (!isNaN(d.getTime())) {
                            formattedDate = d.toISOString().split('T')[0];
                        }
                    }
                } catch (e) {
                    console.warn(`[HubController] Failed to format date for activity ${a.id}:`, e.message);
                }
                return { ...a, date: formattedDate };
            }),
            announcements: announcements.rows,
            gallery: gallery.rows.map(g => ({
                ...g,
                imageUrl: g.image_url,
                eventName: g.event_name
            })),
            practiceSchedules: schedules.rows.map(s => ({
                ...s,
                startTime: s.start_time,
                endTime: s.end_time
            })),
            musicClasses: classes.rows.map(c => ({
                ...c,
                skillLevel: c.skill_level
            }))
        };

        return res.status(200).json(moduleInfo);
    } catch (err) {
        console.error(`[HubController] DB Error for module ${id}:`, err);
        return res.status(500).json({ 
            error: `Error loading module "${id}".`, 
            message: err.message,
            isServerError: true 
        });
    }
};



