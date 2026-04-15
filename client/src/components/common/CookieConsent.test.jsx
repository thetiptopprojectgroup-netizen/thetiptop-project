import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieConsent from './CookieConsent';

jest.mock('../../analytics/gtag', () => ({
  COOKIE_CONSENT_UPDATED_EVENT: 'cookie-consent-updated',
}));

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ne s’affiche pas si un consentement est déjà stocké', () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ analytics: true }));
    render(<CookieConsent />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/Nous utilisons des cookies/i)).not.toBeInTheDocument();
  });

  it('s’affiche après le délai et accepte en persistant le localStorage', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    render(<CookieConsent />);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText(/Nous utilisons des cookies/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /tout accepter/i }));
    const raw = localStorage.getItem('cookie-consent');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.marketing).toBe(true);
    expect(parsed.analytics).toBe(true);
    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });
});
