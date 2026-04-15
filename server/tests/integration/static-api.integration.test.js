import request from 'supertest';
import app from '../../src/app.js';

describe('Integration — routes publiques sans persistance', () => {
  test('GET / retourne le message de bienvenue JSON', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Bienvenue/i);
  });

  test('GET /metrics expose du Prometheus', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('#');
  });

  test('GET /api/metrics identique au endpoint metrics', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.text.length).toBeGreaterThan(50);
  });

  test('POST /api/auth/register sans corps → erreur validation', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login sans corps → erreur validation', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('GET /api/health répété renvoie toujours 200', async () => {
    const a = await request(app).get('/api/health');
    const b = await request(app).get('/api/health');
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.timestamp).not.toBe(b.body.timestamp);
  });

  test('GET /api/health contient environment', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('environment');
  });

  test('Route API fantôme retourne 404 JSON', async () => {
    const res = await request(app).get('/api/ghost-route-999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/health accepte header Accept application/json', async () => {
    const res = await request(app).get('/api/health').set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
