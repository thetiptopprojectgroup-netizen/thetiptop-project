/**
 * Génère public/sitemap.xml et public/robots.txt pour le référencement.
 * Appelé automatiquement avant `vite build` (script npm `prebuild`).
 *
 * lastmod (sitemap) :
 * - Préférence : LASTMOD_DATE=YYYY-MM-DD (injecté par la CI / docker build --build-arg)
 * - Sinon : date du dernier commit touchant client/ (git), si dépôt disponible
 * - Sinon : date UTC du jour
 * Les dates sont validées (format W3C date) et jamais dans le futur (recommandations Google).
 *
 * Usage manuel :
 *   SITE_URL=https://dsp5-archi-o22a-15m-g3.fr LASTMOD_DATE=2026-04-01 node scripts/generate-seo.js
 */
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const clientRoot = join(__dirname, '..');

const baseUrl = (
  process.env.SITE_URL ||
  process.argv[2] ||
  'https://dsp5-archi-o22a-15m-g3.fr'
)
  .replace(/\/$/, '')
  .replace(/^http:\/\//i, 'https://');

function todayUtcYmd() {
  return new Date().toISOString().slice(0, 10);
}

function isValidYmd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Google utilise lastmod comme indice ; éviter les dates futures. */
function clampNotFuture(ymd) {
  const t = todayUtcYmd();
  return ymd > t ? t : ymd;
}

function resolveLastmod() {
  const fromEnv = (process.env.LASTMOD_DATE || '').trim();
  if (fromEnv && isValidYmd(fromEnv)) {
    return clampNotFuture(fromEnv);
  }

  try {
    const raw = execSync('git log -1 --format=%cs -- .', {
      cwd: clientRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const ymd = raw.slice(0, 10);
    if (isValidYmd(ymd)) return clampNotFuture(ymd);
  } catch {
    // pas de git (ex. contexte Docker sans .git)
  }

  return todayUtcYmd();
}

const lastmod = resolveLastmod();

/** Pages publiques indexables (alignées sur App.jsx — pas de zones connectées) */
const sitemapPaths = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/prizes', changefreq: 'weekly', priority: '0.9' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.9' },
  { path: '/rules', changefreq: 'monthly', priority: '0.85' },
  { path: '/faq', changefreq: 'monthly', priority: '0.85' },
  { path: '/legal', changefreq: 'yearly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.55' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.55' },
  { path: '/login', changefreq: 'monthly', priority: '0.65' },
  { path: '/register', changefreq: 'monthly', priority: '0.65' },
  { path: '/forgot-password', changefreq: 'yearly', priority: '0.4' },
];

function buildSitemapXml() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const { path, changefreq, priority } of sitemapPaths) {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${path === '/' ? '/' : path}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

/** Commentaires en ASCII uniquement : evite affichage "MÃªme" si le serveur n\'envoie pas UTF-8. */
function buildRobotsTxt() {
  const lines = [
    '# The Tip Top - jeu-concours (genere au build ; SITE_URL = domaine public du deploiement)',
    '# https://developers.google.com/search/docs/crawling-indexing/robots/intro',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# Zones compte / technique (pas utiles au referencement)',
    'Disallow: /admin',
    'Disallow: /employee',
    'Disallow: /play',
    'Disallow: /dashboard',
    'Disallow: /profile',
    'Disallow: /oauth/',
    'Disallow: /reset-password/',
    '',
    '# Une seule URL Sitemap pour CE domaine (vdev / vpreprod / prod = builds avec SITE_URL different)',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ];
  return lines.join('\n');
}

const sitemapPath = join(publicDir, 'sitemap.xml');
const robotsPath = join(publicDir, 'robots.txt');

writeFileSync(sitemapPath, buildSitemapXml(), 'utf8');
writeFileSync(robotsPath, buildRobotsTxt(), 'utf8');

console.log(`SEO: ${sitemapPath} + ${robotsPath}`);
console.log(`  Base URL: ${baseUrl}`);
console.log(`  lastmod (sitemap): ${lastmod}`);
