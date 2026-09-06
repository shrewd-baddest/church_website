import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";

const VALID_PLATFORMS = ['whatsapp', 'facebook', 'tiktok', 'youtube'];

function normalizePlatform(p) {
  const normalized = p.toLowerCase().trim();
  if (normalized.includes('whatsapp') || normalized.includes('whats app')) return 'whatsapp';
  if (normalized.includes('facebook') || normalized.includes('fb')) return 'facebook';
  if (normalized.includes('tiktok') || normalized.includes('tik tok')) return 'tiktok';
  if (normalized.includes('youtube') || normalized.includes('yt')) return 'youtube';
  return normalized;
}

export function normalizeChannelUrl(platform, rawUrl) {
  if (!rawUrl) return '';
  const url = String(rawUrl).trim();
  const p = (platform || '').toLowerCase();

  let cleaned = url.replace(/^https?:\/\//i, '').replace(/^\/\//, '').trim();

  if (p.includes('tiktok')) {
    if (cleaned.toLowerCase().includes('tiktok.com')) {
      cleaned = cleaned.replace(/^www\./i, '');
      return `https://www.${cleaned}`;
    }
    const handle = cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
    return `https://www.tiktok.com/${handle}`;
  }

  if (p.includes('youtube') || p.includes('youtu.be')) {
    if (cleaned.toLowerCase().includes('youtu.be')) {
      return `https://${cleaned}`;
    }
    if (cleaned.toLowerCase().includes('youtube.com')) {
      cleaned = cleaned.replace(/^www\./i, '');
      return `https://www.${cleaned}`;
    }
    if (cleaned.startsWith('UC') && cleaned.length >= 20) {
      return `https://www.youtube.com/channel/${cleaned}`;
    }
    const handle = cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
    return `https://www.youtube.com/${handle}`;
  }

  if (p.includes('whatsapp') || p.includes('whats app')) {
    if (cleaned.toLowerCase().includes('chat.whatsapp.com') || cleaned.toLowerCase().includes('wa.me')) {
      return `https://${cleaned}`;
    }
    if (!cleaned.includes('/') && cleaned.length >= 15) {
      return `https://chat.whatsapp.com/${cleaned}`;
    }
    const digits = cleaned.replace(/[^0-9]/g, '');
    if (digits.length >= 9) {
      const intl = digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
      return `https://wa.me/${intl}`;
    }
    return `https://${cleaned}`;
  }

  if (p.includes('facebook') || p.includes('fb')) {
    if (cleaned.toLowerCase().includes('facebook.com') || cleaned.toLowerCase().includes('fb.com') || cleaned.toLowerCase().includes('fb.me')) {
      cleaned = cleaned.replace(/^www\./i, '');
      return `https://www.${cleaned}`;
    }
    const page = cleaned.replace(/^@/, '');
    return `https://www.facebook.com/${page}`;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

export const getCommunityModuleChannels = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const result = await pool.query(
      `SELECT platform, url FROM community_module_channels WHERE module_id = $1`,
      [moduleId]
    );
    const channels = result.rows.map(r => ({
      platform: r.platform,
      url: normalizeChannelUrl(r.platform, r.url),
    }));
    res.json({ success: true, channels });
  } catch (error) {
    logger.error(`[CommunityModuleChannels] Get error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch channels" });
  }
};

export const updateCommunityModuleChannels = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { channels } = req.body;

    if (!Array.isArray(channels)) {
      return res.status(400).json({ success: false, error: "channels must be an array" });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing
      await client.query(
        `DELETE FROM community_module_channels WHERE module_id = $1`,
        [moduleId]
      );

      // Insert new
      for (const ch of channels) {
        const platform = normalizePlatform(ch.platform);
        if (!VALID_PLATFORMS.includes(platform)) continue;
        if (!ch.url || !ch.url.trim()) continue;

        const normalizedUrl = normalizeChannelUrl(platform, ch.url);

        await client.query(
          `INSERT INTO community_module_channels (module_id, platform, url)
           VALUES ($1, $2, $3)
           ON CONFLICT (module_id, platform) DO UPDATE SET url = EXCLUDED.url`,
          [moduleId, platform, normalizedUrl]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`[CommunityModuleChannels] Update error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to update channels" });
  }
};