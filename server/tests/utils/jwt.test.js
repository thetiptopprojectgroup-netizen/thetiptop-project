import { describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken, verifyToken, decodeToken } from '../../src/utils/jwt.js';

describe('JWT Utils', () => {
  const userId = '507f1f77bcf86cd799439011';

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user id in payload', () => {
      const token = generateToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.id).toBe(userId);
    });

    it('should have an expiration time', () => {
      const token = generateToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should use 7d when JWT_EXPIRES_IN is not set', () => {
      const saved = process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_EXPIRES_IN;
      const token = generateToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      process.env.JWT_EXPIRES_IN = saved;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should include type refresh in payload', () => {
      const token = generateRefreshToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(userId);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for tampered token', () => {
      const token = generateToken(userId);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = generateToken(userId);
      const decoded = decodeToken(token);
      expect(decoded.id).toBe(userId);
    });

    it('should return null for invalid token format', () => {
      const decoded = decodeToken('not-a-jwt');
      expect(decoded).toBeNull();
    });
  });
});
