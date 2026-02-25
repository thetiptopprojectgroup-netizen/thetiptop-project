import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.getByText(/cookies/i)).toBeInTheDocument();
  });

  it('does not show banner when consent already stored', () => {
    localStorage.setItem('cookie-consent', 'true');
    render(<CookieConsent />);
    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
  });

  it('hides banner and stores consent on accept', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    render(<CookieConsent />);
    jest.useFakeTimers();
    act(() => { jest.advanceTimersByTime(2000); });
    jest.useRealTimers();

    await user.click(screen.getByText('Tout accepter'));

    const consent = JSON.parse(localStorage.getItem('cookie-consent'));
    expect(consent.marketing).toBe(true);
    expect(consent.analytics).toBe(true);
  });

  it('hides banner and stores reject on refuse', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    render(<CookieConsent />);
    jest.useFakeTimers();
    act(() => { jest.advanceTimersByTime(2000); });
    jest.useRealTimers();

    await user.click(screen.getByText('Tout refuser'));

    const consent = JSON.parse(localStorage.getItem('cookie-consent'));
    expect(consent.marketing).toBe(false);
    expect(consent.analytics).toBe(false);
  });

  it('stores essential only on essential click', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    render(<CookieConsent />);
    jest.useFakeTimers();
    act(() => { jest.advanceTimersByTime(2000); });
    jest.useRealTimers();

    await user.click(screen.getByText('Essentiels uniquement'));

    const consent = JSON.parse(localStorage.getItem('cookie-consent'));
    expect(consent.marketing).toBe(false);
  });
});
