/**
 * Serveur de production : fichiers statiques + rendu HTML côté serveur (SSR) pour le SEO.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, 'dist', 'client');
const templatePath = path.join(clientRoot, 'index.html');

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000';

const app = express();

app.use(
  '/api',
  createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
  })
);

app.use(
  express.static(clientRoot, {
    index: false,
    fallthrough: true,
  })
);

let render;
try {
  const serverEntry = pathToFileURL(path.join(__dirname, 'dist', 'server', 'entry-server.js')).href;
  const mod = await import(serverEntry);
  render = mod.render;
} catch (e) {
  console.error('[SSR] Bundle serveur introuvable — exécuter npm run build', e);
}

app.use(async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.includes('.') && req.path !== '/') {
    return res.status(404).type('text/plain').send('Not found');
  }

  let template;
  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch (e) {
    return next(e);
  }

  if (!render) {
    return res.status(200).type('html').send(template.replace('<!--ssr-head-->', ''));
  }

  try {
    const url = req.originalUrl || '/';
    const { html: appHtml, head } = render(url);
    let out = template.replace('<!--ssr-head-->', head || '');
    out = out.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    return res.status(200).type('html').send(out);
  } catch (err) {
    console.error('[SSR] render:', err);
    const fallback = template.replace('<!--ssr-head-->', '');
    return res.status(200).type('html').send(fallback);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[client] SSR + static http://0.0.0.0:${PORT} (proxy API → ${apiTarget})`);
});
