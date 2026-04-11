import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

/**
 * Fetch generic gallery images
 * Access: Public for teasers, Protected with Jumuiya-filtering for full gallery
 */
export const getGallery = async (req, res) => {
    try {
        const user = req.user; // Populated by verifyToken if applicable
        
        // Proximity Algorithm: Find photos taken within +/- 3 days of today's MM-DD (Anniversaries)
        const today = new Date();
        const startDay = new Date(today);
        startDay.setDate(today.getDate() - 3);
        const endDay = new Date(today);
        endDay.setDate(today.getDate() + 3);

        const anniversaryCondition = `
            (EXTRACT(MONTH FROM upload_date) = ${today.getMonth() + 1} 
             AND EXTRACT(DAY FROM upload_date) BETWEEN ${startDay.getDate()} AND ${endDay.getDate()})
        `;

        let query = `
            SELECT *, 
            (${anniversaryCondition}) as is_anniversary
            FROM hub_gallery 
            WHERE moderation_status = 'Approved'
        `;
        let params = [];

        // Access Control Logic
        if (user && user.role !== 'Admin') {
            // Member sees their Jumuiya + General photos
            query += ' AND (module_id = $1 OR module_id = $2)';
            params.push('general');
            params.push(user.jumuiya_id?.toString() || 'none');
        } else if (!user) {
            // Anonymous sees ONLY general
            query += ' AND module_id = $1';
            params.push('general');
        }
        // If Admin, no extra filters (sees everything)

        query += ' ORDER BY upload_date DESC';
        
        const result = await pool.query(query, params);
        
        // Add Seasonal Theme metadata for the frontend
        const now = new Date();
        const month = now.getMonth(); // 0-11
        let activeTheme = 'default';
        
        if (month === 11) activeTheme = 'Christmas';
        else if (month === 10) activeTheme = 'Harvest';
        else if (month === 2 || month === 3) activeTheme = 'Lent';

        res.json({
            items: result.rows,
            theme: activeTheme,
            userContext: user ? { jumuiyaId: user.jumuiya_id } : null
        });
    } catch (error) {
        logger.error(`[GalleryController] Error: ${error.message}`);
        res.status(500).json({ error: "Failed to load gallery data" });
    }
};

/**
 * Fetch only spotlight images for the landing page teaser
 */
export const getGalleryTeaser = async (_req, res) => {
    try {
        const query = `
            SELECT * FROM hub_gallery 
            WHERE is_spotlight = TRUE AND moderation_status = 'Approved' 
            ORDER BY upload_date DESC 
            LIMIT 2
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        logger.error(`[GalleryController Teaser] Error: ${error.message}`);
        res.status(500).json({ error: "Failed to load gallery teaser" });
    }
};

export const uploadToGallery = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const { eventName, description, moduleId, publicId } = req.body;
        const imageUrl = req.file.path; // Cloudinary URL from multer-storage-cloudinary

        const query = `
            INSERT INTO hub_gallery (module_id, image_url, description, event_name, public_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [moduleId || 'general', imageUrl, description || '', eventName || 'Untitled Event', publicId || ''];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error(`[GalleryController Upload] Error: ${error.message}`);
        res.status(500).json({ error: "Failed to save photo to gallery" });
    }
};

/**
 * Add a comment/reflection to a specific memory
 */
export const addComment = async (req, res) => {
    try {
        const { galleryId, comment } = req.body;
        const user = req.user;

        const query = `
            INSERT INTO hub_gallery_comments (gallery_id, user_id, user_name, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [galleryId, user.id, user.firstName, comment]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error(`[GalleryController Comment] Error: ${error.message}`);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

/**
 * Add an emoji reaction to a specific memory
 */
export const addReaction = async (req, res) => {
    try {
        const { galleryId, emoji } = req.body;
        const user = req.user;

        const query = `
            INSERT INTO hub_gallery_reactions (gallery_id, user_id, emoji)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [galleryId, user.id, emoji]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error(`[GalleryController Reaction] Error: ${error.message}`);
        res.status(500).json({ error: "Failed to add reaction" });
    }
};
