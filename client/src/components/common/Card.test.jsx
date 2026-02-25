import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies elevated style', () => {
    const { container } = render(<Card elevated>Content</Card>);
    expect(container.firstChild.className).toContain('card-elevated');
  });

  it('applies default card style when not elevated', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild.className).toContain('card');
  });

  it('applies hover animation classes', () => {
    const { container } = render(<Card hover>Content</Card>);
    expect(container.firstChild.className).toContain('hover:-translate-y-1');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild.className).toContain('custom-class');
  });

  it('applies sm padding', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    expect(container.firstChild.className).toContain('p-4');
  });

  it('applies lg padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    expect(container.firstChild.className).toContain('p-8');
  });

  it('applies none padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    expect(container.firstChild.className).not.toContain('p-');
  });
});

describe('Card.Header', () => {
  it('renders header children', () => {
    render(<Card.Header>Header text</Card.Header>);
    expect(screen.getByText('Header text')).toBeInTheDocument();
  });
});

describe('Card.Title', () => {
  it('renders title as h3', () => {
    render(<Card.Title>My Title</Card.Title>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('My Title');
  });
});

describe('Card.Description', () => {
  it('renders description text', () => {
    render(<Card.Description>Description here</Card.Description>);
    expect(screen.getByText('Description here')).toBeInTheDocument();
  });
});

describe('Card.Body', () => {
  it('renders body children', () => {
    render(<Card.Body>Body content</Card.Body>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});

describe('Card.Footer', () => {
  it('renders footer children', () => {
    render(<Card.Footer>Footer content</Card.Footer>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
