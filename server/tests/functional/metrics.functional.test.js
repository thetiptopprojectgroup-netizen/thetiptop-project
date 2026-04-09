import request from 'supertest';
import app from '../../src/app.js';

describe('Functional - Metrics endpoint', () => {
  test('GET /metrics should expose prometheus payload', async () => {
    const response = await request(app).get('/metrics');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('# HELP');
  });
});
