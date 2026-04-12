/**
 * Google Analytics 4 (gtag.js) — chargement uniquement si consentement analytics (RGPD).
 * ID : propriété GA4 → Admin → flux de données → ID de mesure (format G-XXXXXXXXXX).
 */
export const COOKIE_CONSENT_UPDATED_EVENT = 'cookie-consent-updated';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function getMeasurementId() {
  return typeof MEASUREMENT_ID === 'string' && MEASUREMENT_ID.startsWith('G-')
    ? MEASUREMENT_ID
    : '';
}

export function hasAnalyticsConsent() {
  try {
    const raw = localStorage.getItem('cookie-consent');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

let scriptAppended = false;

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

/**
 * Charge gtag.js et envoie une page vue (SPA : appeler à chaque changement de route).
 */
export function initOrUpdateGtag(pagePath) {
  const id = getMeasurementId();
  if (!id || !hasAnalyticsConsent()) return;

  ensureDataLayer();
  const path = pagePath || `${window.location.pathname}${window.location.search}`;

  if (!scriptAppended) {
    scriptAppended = true;
    window.gtag('js', new Date());
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
  }

  window.gtag('config', id, {
    page_path: path,
  });
}
