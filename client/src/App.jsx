import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlayPage from './pages/PlayPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';
import ProfilePage from './pages/ProfilePage';
import PrizesPage from './pages/PrizesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import RulesPage from './pages/RulesPage';
import FAQPage from './pages/FAQPage';
import LegalPage from './pages/LegalPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CookieConsent from './components/common/CookieConsent';
import InstallPrompt from './components/common/InstallPrompt';
import SeoHead from './components/seo/SeoHead';
import useAuthStore from './store/authStore';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-matcha-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-matcha-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function EmployeeRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-matcha-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['employee', 'admin'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <SeoHead />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2c241e',
            color: '#fcf9f3',
            borderRadius: '12px',
            padding: '16px 24px',
          },
          success: { iconTheme: { primary: '#537856', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <CookieConsent />
      <InstallPrompt />

      <Routes>
        {/* Public routes with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="prizes" element={<PrizesPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="legal" element={<LegalPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />

          {/* Protected routes - authenticated users */}
          <Route path="play" element={<ProtectedRoute><PlayPage /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Employee routes - employees and admins only */}
          <Route path="employee" element={<EmployeeRoute><EmployeePage /></EmployeeRoute>} />

          {/* Admin routes - admins only */}
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        {/* Auth routes without layout */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      api
        .get('/auth/me')
        .then((res) => {
          const role = res?.data?.data?.user?.role;
          window.location.href = role === 'admin' ? '/admin' : '/dashboard';
        })
        .catch(() => {
          window.location.href = '/dashboard';
        });
    } else {
      window.location.href = '/login?error=oauth_failed';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-matcha-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center">
        <div className="text-8xl mb-4">🍵</div>
        <h1 className="text-4xl font-display font-bold text-tea-900 mb-4">Page non trouvée</h1>
        <p className="text-tea-600 mb-8">Cette page semble s'être évaporée comme la vapeur d'un bon thé...</p>
        <a href="/" className="btn-primary">Retour à l'accueil</a>
      </div>
    </div>
  );
}

export default App;
