export const API_BASE = `${import.meta.env.VITE_SERVER_URI}/officials`;
export const API_TERMS = `${API_BASE}/terms`;
export const API_ARCHIVE = `${API_BASE}/archive`;
export const API_HANDOVER = `${API_BASE}/handover`;
export const API_LOOKUP_MEMBER = `${API_BASE}/lookup-member`;
export const API_RESTORE = `${API_BASE}/restore`;
export const API_HISTORY = `${API_BASE}/term`;

export const API_JUMUIYA_BASE = `${import.meta.env.VITE_SERVER_URI}/jumuiya-officials`;
export const API_JUMUIYA_ARCHIVE = `${API_JUMUIYA_BASE}/archive`;
export const API_JUMUIYA_HISTORY = `${API_JUMUIYA_BASE}/term`;
export const API_JUMUIYA_RESTORE = `${API_JUMUIYA_BASE}/restore`;

export const API_GROUP_BASE = `${import.meta.env.VITE_SERVER_URI}/group-officials`;
export const API_GROUP_ARCHIVE = `${API_GROUP_BASE}/archive`;
export const API_GROUP_HISTORY = `${API_GROUP_BASE}/term`;
export const API_GROUP_RESTORE = `${API_GROUP_BASE}/restore`;

// Extract only the domain from the versioned API URI for image assets
export const UPLOAD_BASE = (import.meta.env.VITE_SERVER_URI || '').split('/api')[0];
