import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders label', () => {
    render(<Button>Cliquer</Button>);
    expect(screen.getByRole('button', { name: /cliquer/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Cliquer</Button>);
    await user.click(screen.getByRole('button', { name: /cliquer/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

