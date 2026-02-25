import { render, screen, act, fireEvent } from '@testing-library/react';
import CookieConsent from './CookieConsent';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('./Button', () => {
  return function MockButton({ children, onClick, ...props }) {
    return <button onClick={onClick} {...props}>{children}</button>;
  };
});

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CookieConsent', () => {
  it('shows banner after delay when no consent stored', () => {
    render(<CookieConsent />);
    expect(screen.queryByRole('heading', { name: /nous utilisons des cookies/i })).not.toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.getByRole('heading', { name: /nous utilisons des cookies/i })).toBeInTheDocument();
  });

  it('does not show banner when consent already stored', () => {
    localStorage.setItem('cookie-consent', 'true');
    render(<CookieConsent />);
    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.queryByRole('heading', { name: /nous utilisons des cookies/i })).not.toBeInTheDocument();
  });

  it('hides banner and stores consent on accept', () => {
    render(<CookieConsent />);
    act(() => { jest.advanceTimersByTime(2000); });

    const acceptBtn = screen.getByRole('button', { name: /tout accepter/i });
    fireEvent.click(acceptBtn);

    const consent = JSON.parse(localStorage.getItem('cookie-consent'));
    expect(consent.marketing).toBe(true);
    expect(consent.analytics).toBe(true);
  });

  it('hides banner and stores reject on refuse', () => {
    render(<CookieConsent />);
    act(() => { jest.advanceTimersByTime(2000); });

    const rejectBtn = screen.getByRole('button', { name: /tout refuser/i });
    fireEvent.click(rejectBtn);

    const consent = JSON.parse(localStorage.getItem('cookie-consent'));
    expect(consent.marketing).toBe(false);
    expect(consent.analytics).toBe(false);
  });

  it('stores essential only on essential click', () => {
    render(<CookieConsent />);
    act(() => { jest.advanceTimersByTime(2000); });

    const essentialBtn = screen.getByRole('button', { name: /essentiels uniquement/i });
    fireEvent.click(essentialBtn);

    const consent = JSON.parse(localStorage.getItem('cookie-consent'));
    expect(consent.marketing).toBe(false);
  });
});
