import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COOKIE_CONSENT_UPDATED_EVENT, getMeasurementId, initOrUpdateGtag } from '../../analytics/gtag';

/**
 * Suivi des vues de page pour une SPA : envoie un hit à chaque navigation si GA est configuré
 * et que l’utilisateur a accepté les cookies analytiques.
 */
export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!getMeasurementId()) return undefined;

    const run = () => {
      initOrUpdateGtag(`${location.pathname}${location.search}`);
    };

    run();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, run);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, run);
  }, [location.pathname, location.search]);

  return null;
}
