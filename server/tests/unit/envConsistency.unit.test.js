import bcrypt from 'bcryptjs';
import { validate } from 'uuid';

describe('Cohérence environnement & libs', () => {
  it('bcrypt est disponible et hash/compare fonctionnent', async () => {
    const h = await bcrypt.hash('Password1', 4);
    expect(h.length).toBeGreaterThan(10);
    await expect(bcrypt.compare('Password1', h)).resolves.toBe(true);
  });

  it('uuid valide un identifiant v4', () => {
    expect(validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(validate('not-a-uuid')).toBe(false);
  });

  it('NODE_ENV est défini en test Jest', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('JSON.stringify préserve les clés attendues pour un user minimal', () => {
    const o = { email: 'a@b.co', role: 'user' };
    expect(JSON.parse(JSON.stringify(o))).toEqual(o);
  });
});
