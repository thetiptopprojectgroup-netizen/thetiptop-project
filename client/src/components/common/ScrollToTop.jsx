import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Remonte la page au changement de route (footer, menu, etc.) pour que le nouveau contenu soit visible tout de suite.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
}
