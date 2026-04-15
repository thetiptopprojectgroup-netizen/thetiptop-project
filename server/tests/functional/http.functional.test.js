import request from 'supertest';
import app from '../../src/app.js';

describe('Fonctionnel — contrats HTTP API', () => {
  test('1 · GET /api/health Content-Type JSON', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('2 · GET /api/health corps success true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.success).toBe(true);
  });

  test('3 · GET / racine version présente', async () => {
    const res = await request(app).get('/');
    expect(res.body.version).toMatch(/\d+\.\d+\.\d+/);
  });

  test('4 · GET /metrics statut 200', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
  });

  test('5 · GET /api/metrics statut 200', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.statusCode).toBe(200);
  });

  test('6 · POST /api/auth/register email invalide → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'pas-un-email',
      password: 'Password1',
      firstName: 'A',
      lastName: 'B',
      acceptedTerms: true,
    });
    expect(res.status).toBe(400);
  });

  test('7 · POST /api/auth/login email invalide → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid',
      password: 'x',
    });
    expect(res.status).toBe(400);
  });

  test('8 · GET /api/health timestamp est une chaîne ISO', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('9 · 404 message opérationnelle', async () => {
    const res = await request(app).get('/api/nope-functional');
    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });

  test('10 · HEAD /api/health supporté ou méthode refusée proprement', async () => {
    const res = await request(app).head('/api/health');
    expect([200, 404, 405]).toContain(res.status);
  });

  test('11 · OPTIONS préflight CORS ne plante pas', async () => {
    const res = await request(app).options('/api/health');
    expect(res.status).toBeLessThan(500);
  });

  test('12 · GET /documentation hint dans racine', async () => {
    const res = await request(app).get('/');
    expect(JSON.stringify(res.body)).toMatch(/health/i);
  });

  test('13 · Erreur 404 JSON a success false', async () => {
    const res = await request(app).get('/api/xyz-404-functional');
    expect(res.body.success).toBe(false);
  });

  test('14 · Métriques contiennent un type counter ou histogram', async () => {
    const res = await request(app).get('/metrics');
    const t = res.text;
    expect(t.includes('counter') || t.includes('histogram') || t.includes('gauge')).toBe(true);
  });
});
