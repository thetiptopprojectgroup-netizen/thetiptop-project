/**
 * API minimale pour les E2E Playwright : répond aux routes appelées par la SPA
 * quand Vite proxy /api → http://127.0.0.1:5000 (évite les erreurs ECONNREFUSED en CI).
 */
import http from 'http';

const contestInfo = {
  success: true,
  data: {
    status: 'active',
    dates: {
      start: new Date('2026-03-01T00:00:00.000Z').toISOString(),
      end: new Date('2026-03-30T23:59:59.000Z').toISOString(),
      claimEnd: new Date('2026-04-29T23:59:59.000Z').toISOString(),
    },
    maxTickets: 500000,
    validatedTicketsCount: 0,
  },
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] || '';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url === '/api/health') {
    sendJson(res, 200, {
      success: true,
      message: 'API Thé Tip Top opérationnelle',
      timestamp: new Date().toISOString(),
      environment: 'e2e-mock',
    });
    return;
  }

  if (req.method === 'GET' && url === '/api/contest-info') {
    sendJson(res, 200, contestInfo);
    return;
  }

  if (req.method === 'GET' && url === '/api/reviews/recent') {
    sendJson(res, 200, { success: true, data: { reviews: [] } });
    return;
  }

  if (req.method === 'POST' && url.startsWith('/api/telemetry')) {
    let len = 0;
    req.on('data', (c) => {
      len += c.length;
    });
    req.on('end', () => {
      sendJson(res, 200, { success: true, received: len });
    });
    return;
  }

  if (req.method === 'GET' && url === '/api/auth/me') {
    sendJson(res, 401, { success: false, message: 'Non authentifié' });
    return;
  }

  sendJson(res, 404, { success: false, message: `Mock: ${url} non géré` });
});

server.listen(5000, '127.0.0.1', () => {
  console.log('[e2e-mock-api] http://127.0.0.1:5000');
});
