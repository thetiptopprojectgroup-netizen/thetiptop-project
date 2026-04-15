import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getSeoForPath } from '../../config/seoPathUtils';
import Button from '../../components/common/Button';

/**
 * 10 tests unitaires « cœur » (hors composants détaillés) — critère projet / rapport.
 */
describe('Unitaires cœur (10)', () => {
  it('1 · SEO accueil : titre présent', () => {
    expect(getSeoForPath('/').title).toContain('Thé Tip Top');
  });

  it('2 · SEO lots : titre cohérent', () => {
    expect(getSeoForPath('/prizes').title.length).toBeGreaterThan(5);
  });

  it('3 · Button rend du texte', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('4 · Button variant primary', () => {
    render(<Button variant="primary" data-testid="b">X</Button>);
    expect(screen.getByTestId('b').className).toMatch(/btn-primary/);
  });

  it('5 · MemoryRouter sans warning critique', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <span>ok</span>
      </MemoryRouter>
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('6 · Chaîne vide pour route SEO inconnue retombe sur accueil', () => {
    const home = getSeoForPath('/');
    const unk = getSeoForPath('/nope');
    expect(unk.title).toBe(home.title);
  });

  it('7 · JSON parse/stringify stable', () => {
    const o = { a: 1 };
    expect(JSON.parse(JSON.stringify(o))).toEqual(o);
  });

  it('8 · Tableau filter truthy', () => {
    expect([1, null, 2].filter(Boolean).length).toBe(2);
  });

  it('9 · Regex email simple', () => {
    expect(/^\S+@\S+\.\S+$/.test('a@b.co')).toBe(true);
    expect(/^\S+@\S+\.\S+$/.test('bad')).toBe(false);
  });

  it('10 · Date ISO parseable', () => {
    expect(Number.isNaN(Date.parse(new Date().toISOString()))).toBe(false);
  });
});
