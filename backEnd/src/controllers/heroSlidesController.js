import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

/**
 * GET /hero-slides
 * Returns a combined list of slides for the hero slider:
 *  1. Gallery images with category = 'Hero Slider'
 *  2. Upcoming semester activities (next 3, happening within 30 days)
 *  3. Upcoming weekly activities (next 3, happening within 7 days)
 *  4. Featured or latest in-stock products (up to 5)
 *
 * Query params:
 *  - limit (optional, default 15): max total slides to return
 */
export const getHeroSlides = async (req, res) => {
  try {
    const maxTotal = Math.min(parseInt(req.query.limit) || 15, 30);

    // 1. Check if dynamic slides are enabled
    const settingRes = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'hero_dynamic_enabled'"
    );
    const dynamicEnabled = settingRes.rows[0]?.value !== 'false';

    // 2. Gallery Hero Slider images
    const galleryRes = await pool.query(
      `SELECT id, event_name as title, description, image_url, category, upload_date as event_date
       FROM hub_gallery
       WHERE category = 'Hero Slider' AND moderation_status = 'Approved' AND image_url IS NOT NULL
       ORDER BY upload_date DESC`
    );
    const gallerySlides = galleryRes.rows.map(r => ({
      ...r,
      slide_type: 'gallery',
      link: null,
    }));

    let activitySlides = [];
    let productSlides = [];

    if (dynamicEnabled) {
      // 3. Upcoming semester activities (next 3, happening within 30 days)
      const semesterRes = await pool.query(
        `SELECT id, title, date_time, venue, description, image_url, 'semester' as activity_type
         FROM semester_activities
         WHERE is_active = true AND date_time >= NOW() AND date_time <= NOW() + INTERVAL '30 days'
         ORDER BY date_time ASC
         LIMIT 3`
      );

      // 4. Upcoming weekly activities (next 3, happening within 7 days)
      // For weekly activities, we calculate the next occurrence date
      const weeklyRes = await pool.query(
        `SELECT id, activity, time, venue, 
                image_url, 'weekly' as activity_type,
                day,
                CASE day
                  WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                  WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
                END as day_num
         FROM weekly_activities
         WHERE is_active = true AND image_url IS NOT NULL
         ORDER BY day_num ASC, time ASC
         LIMIT 3`
      );

      // Process semester activities
      const semesterSlides = semesterRes.rows.map(r => {
        const dt = new Date(r.date_time);
        const now = new Date();
        const hoursUntil = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
          id: `activity-semester-${r.id}`,
          title: r.title,
          description: r.venue ? `${r.venue} · ${dt.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : r.description || '',
          image_url: r.image_url || '/images/church.jpg',
          category: 'Upcoming Activity',
          event_date: r.date_time,
          slide_type: 'activity',
          link: '/activities',
          happening_soon: hoursUntil <= 48,
          activity_date: r.date_time,
        };
      });

      // Process weekly activities - calculate next occurrence
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

      const weeklySlides = weeklyRes.rows.map(r => {
        // Parse time string (e.g., "4:00PM-6:00PM" or "16:00")
        const timeMatch = r.time.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i);
        let activityHour = 12, activityMin = 0;
        if (timeMatch) {
          activityHour = parseInt(timeMatch[1]);
          activityMin = parseInt(timeMatch[2] || '0');
          if (timeMatch[3]?.toUpperCase() === 'PM' && activityHour !== 12) activityHour += 12;
          if (timeMatch[3]?.toUpperCase() === 'AM' && activityHour === 12) activityHour = 0;
        }
        const activityMinutes = activityHour * 60 + activityMin;

        // Calculate days until next occurrence
        let targetDay = r.day_num === 7 ? 0 : r.day_num; // Convert Sunday=7 to 0
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && activityMinutes <= currentTime)) {
          daysUntil += 7;
        }

        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntil);
        nextDate.setHours(activityHour, activityMin, 0, 0);

        const hoursUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Only include if within 7 days
        if (hoursUntil > 168) return null;

        return {
          id: `activity-weekly-${r.id}`,
          title: r.activity,
          description: `${r.venue} · ${r.day} · ${r.time}`,
          image_url: r.image_url,
          category: 'Weekly Activity',
          event_date: nextDate.toISOString(),
          slide_type: 'activity',
          link: '/activities',
          happening_soon: hoursUntil <= 48,
          activity_date: nextDate.toISOString(),
        };
      }).filter(Boolean);

      // Combine and sort by next occurrence
      activitySlides = [...semesterSlides, ...weeklySlides]
        .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime())
        .slice(0, 4); // Max 4 activities total

      // 5. Featured products or latest in-stock (up to 5)
      let productsRes = await pool.query(
        `SELECT id, name, price, image_url, category, description, stock
         FROM products
         WHERE is_featured = true AND stock > 0 AND image_url IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 5`
      );
      if (productsRes.rows.length === 0) {
        productsRes = await pool.query(
          `SELECT id, name, price, image_url, category, description, stock
           FROM products
           WHERE stock > 0 AND image_url IS NOT NULL AND category IN ('tshirts', 'sacramentals')
           ORDER BY created_at DESC
           LIMIT 5`
        );
      }
      productSlides = productsRes.rows.map(r => ({
        id: `product-${r.id}`,
        title: r.name,
        description: r.price ? `KES ${Number(r.price).toLocaleString()}${r.category ? ` · ${r.category}` : ''}` : r.description || '',
        image_url: r.image_url,
        category: 'Shop Now',
        event_date: null,
        slide_type: 'product',
        link: '/sacramentals',
        price: r.price,
        product_category: r.category,
      }));
    }

    // 6. Merge: gallery slides first, then interleave activities + products
    const dynamicSlides = [];
    const maxDynamic = Math.min(activitySlides.length + productSlides.length, 6);
    let ai = 0, pi = 0;
    while (dynamicSlides.length < maxDynamic) {
      if (ai < activitySlides.length) dynamicSlides.push(activitySlides[ai++]);
      if (pi < productSlides.length && dynamicSlides.length < maxDynamic) dynamicSlides.push(productSlides[pi++]);
    }

    // Interleave: after every 2 gallery slides, insert 1 dynamic slide
    const combined = [];
    let di = 0;
    for (let i = 0; i < gallerySlides.length && combined.length < maxTotal; i++) {
      combined.push(gallerySlides[i]);
      if ((i + 1) % 2 === 0 && di < dynamicSlides.length && combined.length < maxTotal) {
        combined.push(dynamicSlides[di++]);
      }
    }
    // Append remaining dynamic slides
    while (di < dynamicSlides.length && combined.length < maxTotal) {
      combined.push(dynamicSlides[di++]);
    }

    res.json({ slides: combined, dynamic_enabled: dynamicEnabled });
  } catch (error) {
    logger.error(`[HeroSlides] Error: ${error.message}`);
    // Graceful fallback: return empty so the slider shows the static fallback
    res.json({ slides: [], dynamic_enabled: false });
  }
};