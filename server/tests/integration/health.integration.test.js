import request from 'supertest';
import app from '../../src/app.js';

describe('Integration - Health endpoint', () => {
  test('GET /api/health should return 200 and expected payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'API Thé Tip Top opérationnelle',
      }),
    );
    expect(response.body).toHaveProperty('timestamp');
  });
});
