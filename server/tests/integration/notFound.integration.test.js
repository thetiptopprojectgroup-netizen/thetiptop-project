import request from 'supertest';
import app from '../../src/app.js';

describe('Integration - route inconnue', () => {
  test('GET /api/xyz-route-inexistante retourne 404 JSON', async () => {
    const response = await request(app).get('/api/xyz-route-inexistante-404');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('non trouvée'),
      }),
    );
  });
});
