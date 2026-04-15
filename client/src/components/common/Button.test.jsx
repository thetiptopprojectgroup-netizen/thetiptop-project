import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('affiche le libellé et applique la variante', () => {
    render(
      <Button variant="gold" data-testid="btn">
        Valider
      </Button>
    );
    const btn = screen.getByTestId('btn');
    expect(btn).toHaveTextContent('Valider');
    expect(btn.className).toMatch(/btn-gold/);
  });

  it('désactive le bouton en chargement et affiche le spinner', () => {
    render(
      <Button isLoading data-testid="btn">
        Envoi
      </Button>
    );
    const btn = screen.getByTestId('btn');
    expect(btn).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('désactive si disabled', () => {
    render(
      <Button disabled data-testid="btn">
        Bloqué
      </Button>
    );
    expect(screen.getByTestId('btn')).toBeDisabled();
  });

  it('déclenche onClick au clic', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByRole('button', { name: /cliquer/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('affiche les icônes gauche / droite hors chargement', () => {
    render(
      <Button leftIcon={<span data-testid="left">L</span>} rightIcon={<span data-testid="right">R</span>}>
        Texte
      </Button>
    );
    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });
});
