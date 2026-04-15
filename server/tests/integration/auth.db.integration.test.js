import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { startMemoryMongo, stopMemoryMongo } from '../helpers/memoryMongo.js';

const registerPayload = () => ({
  email: `e2e-${Date.now()}@example.com`,
  password: 'Password1',
  firstName: 'Jean',
  lastName: 'Test',
  acceptedTerms: true,
});

describe('Integration — auth + MongoDB (mémoire)', () => {
  let mongoServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests-min-32-chars!!';
    process.env.NODE_ENV = 'test';
    mongoServer = await startMemoryMongo();
  });

  afterAll(async () => {
    await stopMemoryMongo(mongoServer);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('POST /api/auth/register crée un utilisateur et retourne 201 + token', async () => {
    const body = registerPayload();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeTruthy();
    expect(res.body.data?.user?.email).toBe(body.email.toLowerCase());

    const inDb = await User.findOne({ email: body.email.toLowerCase() });
    expect(inDb).toBeTruthy();
    expect(inDb.prenom).toBe('Jean');
  });

  test('POST /api/auth/register avec le même email → 400', async () => {
    const body = registerPayload();
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/existe déjà/i);
  });

  test('POST /api/auth/login avec bons identifiants → 200 + token', async () => {
    const body = registerPayload();
    await request(app).post('/api/auth/register').send(body);

    const res = await request(app).post('/api/auth/login').send({
      email: body.email,
      password: body.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeTruthy();
  });

  test('POST /api/auth/login avec mauvais mot de passe → 401', async () => {
    const body = registerPayload();
    await request(app).post('/api/auth/register').send(body);

    const res = await request(app).post('/api/auth/login').send({
      email: body.email,
      password: 'WrongPass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect/i);
  });
});
