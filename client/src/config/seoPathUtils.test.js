import { getSeoForPath, shouldNoIndexPath } from './seoPathUtils';

describe('getSeoForPath', () => {
  it('retourne la config SEO pour la page d’accueil', () => {
    const seo = getSeoForPath('/');
    expect(seo.title).toContain('Thé Tip Top');
    expect(seo.description.length).toBeGreaterThan(20);
    expect(seo.keywords).toContain('jeu concours');
  });

  it('retourne la page lots pour /prizes', () => {
    const seo = getSeoForPath('/prizes');
    expect(seo.title).toMatch(/Lots|lots/);
  });

  it('retourne la config reset-password pour tout sous-chemin /reset-password/:token', () => {
    const seo = getSeoForPath('/reset-password/abc123');
    expect(seo.title).toMatch(/mot de passe/i);
  });

  it('retourne le fallback accueil pour une route inconnue', () => {
    const home = getSeoForPath('/');
    const unknown = getSeoForPath('/route-inventee-xyz');
    expect(unknown.title).toBe(home.title);
  });
});

describe('shouldNoIndexPath', () => {
  it('retourne true pour zones privées et outils', () => {
    expect(shouldNoIndexPath('/dashboard')).toBe(true);
    expect(shouldNoIndexPath('/admin')).toBe(true);
    expect(shouldNoIndexPath('/admin/users')).toBe(true);
    expect(shouldNoIndexPath('/play')).toBe(true);
    expect(shouldNoIndexPath('/profile')).toBe(true);
    expect(shouldNoIndexPath('/oauth/callback')).toBe(true);
    expect(shouldNoIndexPath('/newsletter/unsubscribe')).toBe(true);
  });

  it('retourne false pour les pages publiques indexables', () => {
    expect(shouldNoIndexPath('/')).toBe(false);
    expect(shouldNoIndexPath('/rules')).toBe(false);
    expect(shouldNoIndexPath('/legal')).toBe(false);
  });
});
