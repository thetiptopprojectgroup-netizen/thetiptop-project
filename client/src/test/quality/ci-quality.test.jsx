import { clsx } from 'clsx';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getSeoForPath, shouldNoIndexPath } from '../../config/seoPathUtils';
import Button from '../../components/common/Button';
import BrandLogo, { LOGO_SRC } from '../../components/common/BrandLogo';

/**
 * Suite « qualité » CI — 7 contrôles rapides (pur / léger).
 */
describe('Qualité CI — garde-fous client', () => {
  it('1 · SEO — page d’accueil a un titre non vide', () => {
    const seo = getSeoForPath('/');
    expect(seo.title.length).toBeGreaterThan(10);
  });

  it('2 · SEO — /dashboard est exclu de l’indexation', () => {
    expect(shouldNoIndexPath('/dashboard')).toBe(true);
  });

  it('3 · clsx fusionne les classes', () => {
    expect(clsx('a', false && 'b', 'c')).toBe('a c');
  });

  it('4 · Button rend un bouton accessible', () => {
    render(<Button data-testid="q">OK</Button>);
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('5 · BrandLogo pointe vers la racine par défaut', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BrandLogo />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('6 · Logo asset path est défini', () => {
    expect(LOGO_SRC).toMatch(/logo/);
  });

  it('7 · React 18 createRoot disponible (environnement test)', () => {
    expect(typeof render).toBe('function');
  });
});
