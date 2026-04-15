import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('affiche le label et lie htmlFor à id', () => {
    render(<Input id="email" name="email" label="Email" />);
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('affiche l’astérisque si required', () => {
    render(<Input id="x" label="Nom" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('applique input-error et le message d’erreur', () => {
    render(<Input id="p" label="Mot de passe" error="Trop court" />);
    const input = screen.getByLabelText('Mot de passe');
    expect(input.className).toMatch(/input-error/);
    expect(screen.getByText('Trop court')).toBeInTheDocument();
  });

  it('affiche le helperText sans erreur', () => {
    render(<Input id="h" helperText="Indice utile" />);
    expect(screen.getByText('Indice utile')).toHaveClass('text-tea-500');
  });

  it('rend les icônes gauche / droite', () => {
    render(
      <Input
        id="i"
        leftIcon={<span data-testid="li">L</span>}
        rightIcon={<button type="button" data-testid="ri">R</button>}
      />
    );
    expect(screen.getByTestId('li')).toBeInTheDocument();
    expect(screen.getByTestId('ri')).toBeInTheDocument();
  });

  it('propage onChange', () => {
    const onChange = jest.fn();
    render(<Input id="c" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalled();
  });
});
