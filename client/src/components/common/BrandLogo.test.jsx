import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrandLogo, { BrandLogoMark, LOGO_SRC } from './BrandLogo';

describe('BrandLogo', () => {
  it('BrandLogoMark rend l’image avec alt', () => {
    render(<BrandLogoMark size="lg" />);
    const img = screen.getByRole('img', { name: /thé tip top/i });
    expect(img).toHaveAttribute('src', LOGO_SRC);
  });

  it('BrandLogo est un lien vers / par défaut', () => {
    render(
      <MemoryRouter>
        <BrandLogo />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /thé tip top/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('affiche le texte de marque si showText', () => {
    render(
      <MemoryRouter>
        <BrandLogo showText to="/accueil" />
      </MemoryRouter>
    );
    expect(screen.getByText('Thé Tip Top')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/accueil');
  });
});
