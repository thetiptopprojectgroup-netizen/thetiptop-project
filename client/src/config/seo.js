/**
 * SEO : titres et descriptions par route (Google utilise surtout title + meta description).
 * URL canonique / Open Graph : VITE_SITE_URL en prod (voir .env.example).
 */
export const SITE_NAME = 'Thé Tip Top';

export { getSeoForPath, shouldNoIndexPath } from './seoPathUtils.js';

/** URL publique du site (sans slash final) — alignée sur le déploiement / Search Console */
export function getSiteUrl() {
  const v = import.meta.env.VITE_SITE_URL;
  if (v && typeof v === 'string') return v.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://dsp5-archi-o22a-15m-g3.fr';
}
