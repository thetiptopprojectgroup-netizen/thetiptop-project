import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeoForPath, getSiteUrl, SITE_NAME } from '../../config/seo';

function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Met à jour title, meta description, keywords, Open Graph, Twitter et canonical selon la route.
 */
const NOINDEX_PREFIXES = ['/admin', '/employee', '/play', '/dashboard', '/profile', '/oauth'];

const PRIVATE_SEO = {
  title: `${SITE_NAME} — Espace personnel`,
  description: 'Accès sécurisé à votre compte Thé Tip Top (jeu-concours).',
  keywords: '',
};

export default function SeoHead() {
  const { pathname } = useLocation();
  const privateArea = NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const seo = privateArea ? PRIVATE_SEO : getSeoForPath(pathname);
  const base = getSiteUrl();
  const canonical = `${base}${pathname === '/' ? '' : pathname}`;

  useEffect(() => {
    document.title = seo.title;
    setMeta('description', seo.description);
    if (seo.keywords) setMeta('keywords', seo.keywords);
    if (privateArea) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow');
    }

    setMeta('og:type', 'website', true);
    setMeta('og:url', canonical, true);
    setMeta('og:title', seo.title, true);
    setMeta('og:description', seo.description, true);
    setMeta('og:locale', 'fr_FR', true);

    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:url', canonical, true);
    setMeta('twitter:title', seo.title, true);
    setMeta('twitter:description', seo.description, true);

    setLink('canonical', canonical);
  }, [pathname, seo, canonical, privateArea]);

  return null;
}
