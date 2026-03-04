/**
 * Génère public/sitemap.xml avec l'URL de base selon l'environnement.
 * Usage: SITE_URL=https://dev.thetiptop-jeu.fr node scripts/generate-sitemap.js
 *        ou npm run sitemap:dev / sitemap:local / sitemap:preprod / sitemap:prod
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// SITE_URL en variable d'env ou 1er argument : node scripts/generate-sitemap.js https://dev.thetiptop-jeu.fr
const baseUrl = (process.env.SITE_URL || process.argv[2] || 'https://thetiptop-jeu.fr').replace(/\/$/, '');

const paths = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/prizes', changefreq: 'weekly', priority: '0.9' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.9' },
  { path: '/rules', changefreq: 'monthly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.8' },
  { path: '/legal', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
  { path: '/plan-du-site', changefreq: 'monthly', priority: '0.6' },
  { path: '/login', changefreq: 'monthly', priority: '0.7' },
  { path: '/register', changefreq: 'monthly', priority: '0.7' },
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const { path, changefreq, priority } of paths) {
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}${path}</loc>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>\n';
}

// Entrée www uniquement pour la prod
if (baseUrl === 'https://thetiptop-jeu.fr') {
  xml += '  <url>\n';
  xml += '    <loc>https://www.thetiptop-jeu.fr/</loc>\n';
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
}

xml += '</urlset>\n';

const outPath = join(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`Sitemap généré: ${outPath} (base: ${baseUrl})`);
