import { jest, describe, it, expect } from '@jest/globals';
import { AppError, notFound } from '../../src/middlewares/errorHandler.js';

describe('Error Handler', () => {
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
});
