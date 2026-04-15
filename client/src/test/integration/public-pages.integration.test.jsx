import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

jest.mock('../../services/api', () => ({
  telemetryService: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../components/auth/SocialAuthSection', () => ({
  __esModule: true,
  default: function SocialAuthSectionMock() {
    return <div data-testid="social-auth-mock">OAuth</div>;
  },
}));

import RulesPage from '../../pages/RulesPage';
import FAQPage from '../../pages/FAQPage';
import LegalPage from '../../pages/LegalPage';
import TermsPage from '../../pages/TermsPage';
import PrivacyPage from '../../pages/PrivacyPage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import PrizesPage from '../../pages/PrizesPage';
import HowItWorksPage from '../../pages/HowItWorksPage';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderRoute(path, Page) {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]} future={routerFuture}>
        <Routes>
          <Route path={path} element={<Page />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

function LocationProbe() {
  const loc = useLocation();
  return <span data-testid="loc">{loc.pathname}</span>;
}

describe('Intégration — pages publiques + router', () => {
  it('Rules affiche le titre du règlement', async () => {
    renderRoute('/rules', RulesPage);
    expect(await screen.findByRole('heading', { name: /règlement du jeu-concours/i })).toBeInTheDocument();
  });

  it('FAQ affiche le titre FAQ', async () => {
    renderRoute('/faq', FAQPage);
    expect(await screen.findByRole('heading', { name: /^FAQ$/i })).toBeInTheDocument();
  });

  it('Mentions légales — titre', async () => {
    renderRoute('/legal', LegalPage);
    expect(await screen.findByRole('heading', { name: /mentions légales/i })).toBeInTheDocument();
  });

  it('CGU — titre', async () => {
    renderRoute('/terms', TermsPage);
    expect(await screen.findByRole('heading', { name: /conditions générales/i })).toBeInTheDocument();
  });

  it('Confidentialité — titre', async () => {
    renderRoute('/privacy', PrivacyPage);
    expect(await screen.findByRole('heading', { name: /politique de confidentialité/i })).toBeInTheDocument();
  });

  it('Login — titre accueil joueur', async () => {
    renderRoute('/login', LoginPage);
    expect(await screen.findByRole('heading', { name: /Bon retour parmi nous/i })).toBeInTheDocument();
  });

  it('Register — création de compte', async () => {
    renderRoute('/register', RegisterPage);
    expect(await screen.findByRole('heading', { name: /créez votre compte/i })).toBeInTheDocument();
  });

  it('Lots — titre page prix', async () => {
    renderRoute('/prizes', PrizesPage);
    expect(await screen.findByRole('heading', { name: /les lots à gagner/i })).toBeInTheDocument();
  });

  it('Comment participer — titre', async () => {
    renderRoute('/how-it-works', HowItWorksPage);
    expect(await screen.findByRole('heading', { name: /comment participer/i })).toBeInTheDocument();
  });

  it('Router — bascule FAQ vs Rules en mémoire', () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/faq']} future={routerFuture}>
          <Routes>
            <Route path="/faq" element={<div>FAQ route</div>} />
            <Route path="/rules" element={<div>Rules route</div>} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(screen.getByText('FAQ route')).toBeInTheDocument();
  });

  it('HelmetProvider enveloppe le rendu', () => {
    render(
      <HelmetProvider>
        <div data-testid="h">ok</div>
      </HelmetProvider>
    );
    expect(screen.getByTestId('h')).toHaveTextContent('ok');
  });

  it('MemoryRouter — pathname initial', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']} future={routerFuture}>
        <LocationProbe />
      </MemoryRouter>
    );
    expect(screen.getByTestId('loc')).toHaveTextContent('/privacy');
  });

  it('Login — placeholder email', async () => {
    renderRoute('/login', LoginPage);
    expect(await screen.findByPlaceholderText('votre@email.com')).toBeInTheDocument();
  });

  it('Register — placeholder mot de passe', async () => {
    renderRoute('/register', RegisterPage);
    expect(await screen.findByPlaceholderText('••••••••')).toBeInTheDocument();
  });
});
