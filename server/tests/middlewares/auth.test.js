import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockVerify = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));

jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: { findById: mockFindById },
}));

const { protect, restrictTo, employeeOrAdmin, adminOnly } = await import('../../src/middlewares/auth.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect', () => {
    it('returns 401 when no token provided', async () => {
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('extracts token from Authorization header', async () => {
      req.headers.authorization = 'Bearer valid-token';
      mockVerify.mockReturnValue({ id: '123' });
      mockFindById.mockResolvedValue({ _id: '123', actif: true });

      await protect(req, res, next);
      expect(mockVerify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(next).toHaveBeenCalled();
    });

    it('extracts token from cookies', async () => {
      req.cookies = { token: 'cookie-token' };
      mockVerify.mockReturnValue({ id: '123' });
      mockFindById.mockResolvedValue({ _id: '123', actif: true });

      await protect(req, res, next);
      expect(mockVerify).toHaveBeenCalledWith('cookie-token', expect.any(String));
    });

    it('returns 401 when user not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      mockVerify.mockReturnValue({ id: '123' });
      mockFindById.mockResolvedValue(null);

      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when user is not active', async () => {
      req.headers.authorization = 'Bearer valid-token';
      mockVerify.mockReturnValue({ id: '123' });
      mockFindById.mockResolvedValue({ _id: '123', actif: false });

      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for invalid token (JsonWebTokenError)', async () => {
      req.headers.authorization = 'Bearer bad-token';
      const err = new Error('invalid');
      err.name = 'JsonWebTokenError';
      mockVerify.mockImplementation(() => { throw err; });

      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      mockVerify.mockImplementation(() => { throw err; });

      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls next with error for unexpected errors', async () => {
      req.headers.authorization = 'Bearer token';
      mockVerify.mockImplementation(() => { throw new Error('unexpected'); });

      await protect(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('restrictTo', () => {
    it('allows access for matching role', () => {
      req.user = { role: 'admin' };
      const middleware = restrictTo('admin', 'employee');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies access for non-matching role', () => {
      req.user = { role: 'user' };
      const middleware = restrictTo('admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('employeeOrAdmin', () => {
    it('allows employee', () => {
      req.user = { role: 'employee' };
      employeeOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows admin', () => {
      req.user = { role: 'admin' };
      employeeOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies regular user', () => {
      req.user = { role: 'user' };
      employeeOrAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('adminOnly', () => {
    it('allows admin', () => {
      req.user = { role: 'admin' };
      adminOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies non-admin', () => {
      req.user = { role: 'employee' };
      adminOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
