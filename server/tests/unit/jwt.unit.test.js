import { generateToken, generateRefreshToken, verifyToken, decodeToken } from '../../src/utils/jwt.js';

describe('jwt utils', () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevExpires = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-jest-only-min-32-chars!!';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    process.env.JWT_SECRET = prevSecret;
    process.env.JWT_EXPIRES_IN = prevExpires;
  });

  it('generateToken signe un payload avec id et se vérifie', () => {
    const token = generateToken('507f1f77bcf86cd799439011');
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.id).toBe('507f1f77bcf86cd799439011');
  });

  it('generateRefreshToken inclut type refresh', () => {
    const token = generateRefreshToken('507f1f77bcf86cd799439011');
    const decoded = verifyToken(token);
    expect(decoded.type).toBe('refresh');
    expect(decoded.id).toBe('507f1f77bcf86cd799439011');
  });

  it('verifyToken rejette un token invalide', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });

  it('decodeToken lit le payload sans vérifier la signature', () => {
    const token = generateToken('abc');
    const decoded = decodeToken(token);
    expect(decoded.id).toBe('abc');
  });
});
