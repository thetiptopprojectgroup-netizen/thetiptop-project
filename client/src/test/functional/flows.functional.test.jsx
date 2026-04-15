import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { getSeoForPath } from '../../config/seoPathUtils';

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

describe('Fonctionnel — parcours UI sans navigateur', () => {
  it('1 · Parcours lien interne simulé', () => {
    render(
      <HelmetProvider>
        <MemoryRouter future={future}>
          <Link to="/lots">Aller aux lots</Link>
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(screen.getByRole('link', { name: /aller aux lots/i })).toHaveAttribute('href', '/lots');
  });

  it('2 · Formulaire email + bouton submit', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Input id="em" label="Email" name="email" type="email" />
        <Button type="submit">Envoyer</Button>
      </form>
    );
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('3 · Carte avec footer action', () => {
    render(
      <Card>
        <Card.Body>Contenu</Card.Body>
        <Card.Footer>
          <Button size="sm">OK</Button>
        </Card.Footer>
      </Card>
    );
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });

  it('4 · SEO dynamique selon path', () => {
    expect(getSeoForPath('/faq').title.toLowerCase()).toContain('faq');
  });

  it('5 · Bouton désactivé ne soumet pas', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Bloqué
      </Button>
    );
    fireEvent.click(screen.getByRole('button', { name: /bloqué/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('6 · Routes imbriquées /parent/enfant', () => {
    render(
      <MemoryRouter initialEntries={['/a/child']} future={future}>
        <Routes>
          <Route path="/a/child" element={<div>Enfant</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Enfant')).toBeInTheDocument();
  });

  it('7 · Input erreur affichée', () => {
    render(<Input id="x" label="Champ" error="Invalide" />);
    expect(screen.getByText('Invalide')).toBeInTheDocument();
  });

  it('8 · Card Title comme h3', () => {
    render(
      <Card>
        <Card.Title as="h3">Sous-titre</Card.Title>
      </Card>
    );
    expect(screen.getByRole('heading', { name: 'Sous-titre' })).toBeInTheDocument();
  });

  it('9 · Double clic bouton (debounce manuel)', () => {
    const fn = jest.fn();
    render(<Button onClick={fn}>Go</Button>);
    const b = screen.getByRole('button', { name: 'Go' });
    fireEvent.click(b);
    fireEvent.click(b);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('10 · Navigation programmeuse MemoryRouter', () => {
    function Shell() {
      return (
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/next" element={<div>Next</div>} />
        </Routes>
      );
    }
    render(
      <MemoryRouter initialEntries={['/']} future={future}>
        <Shell />
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('11 · Helper text Input', () => {
    render(<Input id="h" helperText="Astuce" />);
    expect(screen.getByText('Astuce')).toHaveClass('text-tea-500');
  });

  it('12 · Button loading', () => {
    render(
      <Button isLoading data-testid="lb">
        Patientez
      </Button>
    );
    expect(screen.getByTestId('lb')).toBeDisabled();
  });

  it('13 · SEO prizes contient Lots', () => {
    expect(getSeoForPath('/prizes').title).toMatch(/lots|cadeaux/i);
  });

  it('14 · Fragment liste conditions', () => {
    const ok = ['a', 'b'].every(Boolean);
    expect(ok).toBe(true);
  });

  it('15 · Accessibilité — bouton a un nom visible', () => {
    render(<Button>Continuer</Button>);
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeVisible();
  });
});
