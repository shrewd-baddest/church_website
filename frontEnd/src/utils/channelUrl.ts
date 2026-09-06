/**
 * Utility to normalize channel URLs and handles into valid, clickable HTTPS URLs.
 * Handles cases where admins input plain handles (@handle, handle), missing protocols,
 * apex domains, or invite codes.
 */
export const normalizeChannelUrl = (platform: string, rawUrl: string): string => {
  if (!rawUrl) return '';
  const url = String(rawUrl).trim();
  const p = (platform || '').toLowerCase();

  // Strip leading protocols and slashes to inspect the core content
  let cleaned = url.replace(/^https?:\/\//i, '').replace(/^\/\//, '').trim();

  // 1. TikTok
  if (p.includes('tiktok')) {
    if (cleaned.toLowerCase().includes('tiktok.com')) {
      cleaned = cleaned.replace(/^www\./i, '');
      return `https://www.${cleaned}`;
    }
    const handle = cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
    return `https://www.tiktok.com/${handle}`;
  }

  // 2. YouTube
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

  // 3. WhatsApp
  if (p.includes('whatsapp') || p.includes('whats app')) {
    if (cleaned.toLowerCase().includes('chat.whatsapp.com')) {
      return `https://${cleaned}`;
    }
    if (cleaned.toLowerCase().includes('wa.me')) {
      return `https://${cleaned}`;
    }
    // If it's an invite code (alphanumeric like "HmI4tRfDrAtFb1RXjhTNIY")
    if (!cleaned.includes('/') && cleaned.length >= 15) {
      return `https://chat.whatsapp.com/${cleaned}`;
    }
    // If it's a phone number
    const digits = cleaned.replace(/[^0-9]/g, '');
    if (digits.length >= 9) {
      const intl = digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
      return `https://wa.me/${intl}`;
    }
    return `https://${cleaned}`;
  }

  // 4. Facebook
  if (p.includes('facebook') || p.includes('fb')) {
    if (
      cleaned.toLowerCase().includes('facebook.com') ||
      cleaned.toLowerCase().includes('fb.com') ||
      cleaned.toLowerCase().includes('fb.me')
    ) {
      cleaned = cleaned.replace(/^www\./i, '');
      return `https://www.${cleaned}`;
    }
    const page = cleaned.replace(/^@/, '');
    return `https://www.facebook.com/${page}`;
  }

  // Fallback for other platforms
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};
