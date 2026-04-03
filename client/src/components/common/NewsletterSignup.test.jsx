import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewsletterSignup from './NewsletterSignup';

const mockSubscribe = jest.fn();
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));
jest.mock('../../services/api.js', () => ({
  newsletterService: {
    subscribe: (...args) => mockSubscribe(...args),
  },
}));

import toast from 'react-hot-toast';

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockResolvedValue({ data: { message: 'Merci ! Vous êtes inscrit.' } });
});

describe('NewsletterSignup', () => {
  it('renders title, description, email input, checkbox and submit button', () => {
    render(<NewsletterSignup />);
    expect(screen.getByRole('heading', { name: /newsletter/i })).toBeInTheDocument();
    expect(screen.getByText(/restez informé des actualités du jeu-concours/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /adresse email pour la newsletter/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /j'accepte de recevoir la newsletter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it('applies className and defaults source to footer', () => {
    const { container } = render(<NewsletterSignup className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows toast error when email is empty', async () => {
    render(<NewsletterSignup />);
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Veuillez saisir votre adresse email.');
    });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('shows toast error when email is invalid', async () => {
    const { container } = render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /adresse email/i });
    fireEvent.change(input, { target: { value: 'invalid' } });
    const form = container.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Veuillez saisir une adresse email valide.');
    });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('shows toast error when consent is unchecked', async () => {
    render(<NewsletterSignup />);
    fireEvent.change(screen.getByRole('textbox', { name: /adresse email/i }), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /j'accepte de recevoir/i }));
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Veuillez accepter de recevoir la newsletter.');
    });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('calls subscribe with email, consent and source on valid submit', async () => {
    render(<NewsletterSignup source="footer" />);
    fireEvent.change(screen.getByRole('textbox', { name: /adresse email/i }), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('user@example.com', true, 'footer');
    });
  });

  it('shows success toast and clears email on successful subscription', async () => {
    render(<NewsletterSignup />);
    const input = screen.getByRole('textbox', { name: /adresse email/i });
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Merci ! Vous êtes inscrit.');
    });
    expect(input).toHaveValue('');
  });

  it('shows error toast when API fails', async () => {
    mockSubscribe.mockRejectedValueOnce({ response: { data: { message: 'Erreur serveur' } } });
    render(<NewsletterSignup />);
    fireEvent.change(screen.getByRole('textbox', { name: /adresse email/i }), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erreur serveur');
    });
  });

  it('shows generic error message when API fails without message', async () => {
    mockSubscribe.mockRejectedValueOnce(new Error('Network error'));
    render(<NewsletterSignup />);
    fireEvent.change(screen.getByRole('textbox', { name: /adresse email/i }), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Une erreur est survenue. Réessayez plus tard.');
    });
  });
});
