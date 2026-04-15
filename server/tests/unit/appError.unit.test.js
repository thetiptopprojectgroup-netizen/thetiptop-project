import { AppError } from '../../src/middlewares/errorHandler.js';

describe('AppError', () => {
  it('expose message, statusCode, status fail pour 4xx', () => {
    const err = new AppError('Ressource introuvable', 404);
    expect(err.message).toBe('Ressource introuvable');
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });

  it('status error pour 5xx', () => {
    const err = new AppError('Erreur serveur', 500);
    expect(err.status).toBe('error');
  });
});
