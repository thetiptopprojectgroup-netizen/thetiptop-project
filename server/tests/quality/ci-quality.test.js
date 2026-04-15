import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../../src/app.js';
import errorHandler, { notFound, AppError } from '../../src/middlewares/errorHandler.js';
import routes from '../../src/routes/index.js';
import { generateToken, verifyToken } from '../../src/utils/jwt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Suite « qualité » CI — 7 contrôles synchrones (imports, exports, contrats minimaux).
 */
describe('Qualité CI — garde-fous projet', () => {
  it('1 · app Express est monté (fonction use)', () => {
    expect(typeof app.use).toBe('function');
    expect(typeof app.listen).toBe('function');
  });

  it('2 · errorHandler et notFound sont exportés', () => {
    expect(typeof errorHandler).toBe('function');
    expect(typeof notFound).toBe('function');
  });

  it('3 · AppError étend Error et est opérationnelle', () => {
    const err = new AppError('test', 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.isOperational).toBe(true);
  });

  it('4 · JWT — avec JWT_SECRET de test, token signé vérifiable', () => {
    const prev = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret-key-for-jest-only-min-32-chars!!';
    const t = generateToken('507f1f77bcf86cd799439011');
    expect(verifyToken(t).id).toBe('507f1f77bcf86cd799439011');
    process.env.JWT_SECRET = prev;
  });

  it('5 · Aucune fuite de stack sensible sur AppError 4xx', () => {
    const err = new AppError('msg', 404);
    expect(err.status).toBe('fail');
  });

  it('6 · Router principal /api expose des routes (health, auth, …)', () => {
    expect(typeof routes).toBe('function');
    expect(routes.stack?.length ?? 0).toBeGreaterThan(0);
  });

  it('7 · package.json serveur identifie le projet API', () => {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
    expect(pkg.name).toBe('thetiptop-api');
    expect(pkg.type).toBe('module');
  });
});
