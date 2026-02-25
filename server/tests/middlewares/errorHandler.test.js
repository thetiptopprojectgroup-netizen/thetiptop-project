import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import errorHandler, { AppError, notFound } from '../../src/middlewares/errorHandler.js';

describe('Error Handler', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const error = new AppError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });

    it('should set status to fail for 4xx errors', () => {
      const error = new AppError('Bad request', 400);
      expect(error.status).toBe('fail');
    });

    it('should set status to error for 5xx errors', () => {
      const error = new AppError('Server error', 500);
      expect(error.status).toBe('error');
    });

    it('should be operational', () => {
      const error = new AppError('Test', 400);
      expect(error.isOperational).toBe(true);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test', 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('notFound middleware', () => {
    it('should create a 404 AppError', () => {
      const req = { originalUrl: '/api/unknown' };
      const next = jest.fn();

      notFound(req, {}, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('/api/unknown');
    });
  });

  describe('errorHandler middleware', () => {
    const next = jest.fn();

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      if (console.error.mockRestore) console.error.mockRestore();
    });

    it('in development sends full error with stack', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('Dev error');
      err.statusCode = 500;
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Dev error',
          stack: expect.any(String),
        })
      );
      process.env.NODE_ENV = 'test';
    });

    it('handles duplicate key error (code 11000)', () => {
      const err = new Error('Duplicate');
      err.code = 11000;
      err.keyValue = { email: 'test@test.com' };
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'email "test@test.com" existe déjà. Veuillez utiliser une autre valeur.',
      });
    });

    it('handles Mongoose ValidationError', () => {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.errors = [{ message: 'Email is required' }, { message: 'Invalid format' }];
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Données invalides: Email is required. Invalid format',
      });
    });

    it('handles CastError', () => {
      const err = new Error('Cast failed');
      err.name = 'CastError';
      err.path = 'id';
      err.value = 'invalid-id';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valeur invalide pour le champ id: invalid-id',
      });
    });

    it('handles JsonWebTokenError', () => {
      const err = new Error('jwt malformed');
      err.name = 'JsonWebTokenError';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide. Veuillez vous reconnecter.',
      });
    });

    it('handles TokenExpiredError', () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
      });
    });

    it('handles operational AppError', () => {
      const err = new AppError('Bad request', 400);
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
      });
    });

    it('handles unknown errors with 500', () => {
      const err = new Error('Unexpected');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Une erreur interne est survenue',
      });
      expect(console.error).toHaveBeenCalled();
    });

    it('uses err.statusCode when provided for unknown error', () => {
      const err = new Error('Custom');
      err.statusCode = 418;
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Une erreur interne est survenue' })
      );
    });
  });
});
