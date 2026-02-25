import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<Input label="Email" name="email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays helper text', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('prioritizes error over helperText', () => {
    render(<Input error="Error!" helperText="Help" />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.queryByText('Help')).not.toBeInTheDocument();
  });

  it('renders left icon', () => {
    render(<Input leftIcon={<span data-testid="left-icon">L</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Input rightIcon={<span data-testid="right-icon">R</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('handles user typing', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type" />);
    const input = screen.getByPlaceholderText('Type');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} placeholder="ref-test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
