/** Base API (ex. /api ou https://api.example.com/api) — aligné sur api.js */
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/**
 * URL de démarrage OAuth (Google / Facebook) — même logique qu’en dev (proxy) ou prod (URL absolue).
 */
export function getOAuthStartUrl(provider) {
  const path = `/auth/${provider}`;
  if (API_BASE.startsWith('http')) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}${path}`;
}
