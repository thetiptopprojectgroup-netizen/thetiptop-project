import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('rend le contenu avec padding par défaut', () => {
    const { container } = render(<Card>Contenu carte</Card>);
    expect(screen.getByText('Contenu carte')).toBeInTheDocument();
    const root = container.firstChild;
    expect(root.className).toMatch(/card/);
    expect(root.className).toMatch(/p-6/);
  });

  it('applique elevated et hover', () => {
    const { container } = render(
      <Card elevated hover>
        X
      </Card>
    );
    const root = container.firstChild;
    expect(root.className).toMatch(/card-elevated/);
    expect(root.className).toMatch(/hover:-translate-y-1/);
  });

  it('compose Header et Title', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title as="h2">Titre section</Card.Title>
        </Card.Header>
        <p>Corps</p>
      </Card>
    );
    expect(screen.getByRole('heading', { name: 'Titre section' })).toBeInTheDocument();
    expect(screen.getByText('Corps')).toBeInTheDocument();
  });

  it('compose Description, Body et Footer', () => {
    render(
      <Card>
        <Card.Description>Sous-titre</Card.Description>
        <Card.Body>Contenu body</Card.Body>
        <Card.Footer>
          <span>Pied</span>
        </Card.Footer>
      </Card>
    );
    expect(screen.getByText('Sous-titre')).toHaveClass('text-tea-600');
    expect(screen.getByText('Contenu body')).toBeInTheDocument();
    expect(screen.getByText('Pied')).toBeInTheDocument();
  });
});
