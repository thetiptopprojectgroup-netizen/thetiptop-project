import { describe, it, expect, jest } from '@jest/globals';
import { validationResult } from 'express-validator';
import { validate } from '../../src/middlewares/validate.js';

describe('Validate Middleware', () => {
  it('calls next when no validation errors', async () => {
    const mockValidation = { run: jest.fn().mockResolvedValue(undefined) };
    const middleware = validate([mockValidation]);

    const req = { body: { email: 'test@test.com' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await middleware(req, res, next);
    expect(mockValidation.run).toHaveBeenCalledWith(req);
  });

  it('returns 400 with formatted errors on validation failure', async () => {
    const { body } = await import('express-validator');
    const middleware = validate([body('email').isEmail().withMessage('Email invalide')]);

    const req = { body: { email: 'not-email' }, headers: {}, query: {}, params: {}, cookies: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Erreurs de validation',
        errors: expect.any(Array),
      })
    );
  });
});
