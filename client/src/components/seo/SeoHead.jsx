import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getSeoForPath, getSiteUrl, SITE_NAME, shouldNoIndexPath } from '../../config/seo';

const PRIVATE_SEO = {
  title: `${SITE_NAME} — Espace personnel`,
  description: 'Accès sécurisé à votre compte Thé Tip Top (jeu-concours).',
  keywords: '',
};

/**
 * Titres, meta description, Open Graph, Twitter et canonical par route — rendus dans le HTML (SSR + Helmet).
 */
export default function SeoHead() {
  const { pathname } = useLocation();
  const noIndex = shouldNoIndexPath(pathname);
  const privateArea =
    noIndex && pathname !== '/newsletter/unsubscribe' && !pathname.startsWith('/reset-password');
  const seo = privateArea ? PRIVATE_SEO : getSeoForPath(pathname);
  const base = getSiteUrl();
  const canonical = `${base}${pathname === '/' ? '' : pathname}`;
  const ogImage = `${base}/images/logo/logo.png`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} — logo du jeu-concours thé`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
