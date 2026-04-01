import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Gift, BarChart3, Leaf } from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/prizes', label: 'Les Lots' },
    { href: '/how-it-works', label: 'Comment jouer' },
    { href: '/rules', label: 'Règlement' },
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="container-wide">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  isScrolled ? 'bg-matcha-600' : 'bg-matcha-600/90'
                )}
              >
                <Leaf className="w-5 h-5 text-white" />
              </div>
              {/* Steam effect */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-3 bg-white/60 rounded-full animate-steam" />
              </div>
            </div>
            <span
              className={clsx(
                'font-display text-xl font-bold transition-colors',
                isScrolled ? 'text-tea-900' : 'text-white'
              )}
            >
              Thé Tip Top
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={clsx(
                  'relative font-medium transition-colors',
                  isScrolled
                    ? isActive(link.href)
                      ? 'text-matcha-600'
                      : 'text-tea-700 hover:text-matcha-600'
                    : isActive(link.href)
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="activeNav"
                    className={clsx(
                      'absolute -bottom-1 left-0 right-0 h-0.5 rounded-full',
                      isScrolled ? 'bg-matcha-600' : 'bg-white'
                    )}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Play button */}
                <Link to="/play">
                  <Button variant="gold" size="sm" leftIcon={<Gift className="w-4 h-4" />}>
                    Jouer
                  </Button>
                </Link>

                {/* User dropdown */}
                <div className="relative group">
                  <button
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                      isScrolled
                        ? 'hover:bg-cream-100 text-tea-700'
                        : 'hover:bg-white/10 text-white'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-matcha-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-matcha-600" />
                    </div>
                    <span className="font-medium">{user?.firstName}</span>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-white rounded-xl shadow-elevated py-2 min-w-[200px]">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-cream-50 text-tea-700"
                      >
                        <Gift className="w-5 h-5" />
                        Mes gains
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-cream-50 text-tea-700"
                      >
                        <User className="w-5 h-5" />
                        Mon profil
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'employee') && (
                        <Link
                          to="/employee"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-cream-50 text-tea-700"
                        >
                          <Gift className="w-5 h-5" />
                          Espace Caissier
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-cream-50 text-tea-700"
                        >
                          <BarChart3 className="w-5 h-5" />
                          Administration
                        </Link>
                      )}
                      <hr className="my-2 border-cream-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant={isScrolled ? 'ghost' : 'secondary'}
                    size="sm"
                    className={!isScrolled ? 'border-white/30 text-white hover:bg-white/10' : ''}
                  >
                    Connexion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="gold" size="sm">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={clsx(
              'lg:hidden p-2 rounded-lg transition-colors',
              isScrolled
                ? 'hover:bg-cream-100 text-tea-700'
                : 'hover:bg-white/10 text-white'
            )}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-cream-200 overflow-hidden"
          >
            <div className="container-wide py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={clsx(
                    'block px-4 py-3 rounded-xl transition-colors',
                    isActive(link.href)
                      ? 'bg-matcha-50 text-matcha-700'
                      : 'hover:bg-cream-50 text-tea-700'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <hr className="my-4 border-cream-200" />

              {isAuthenticated ? (
                <>
                  <Link
                    to="/play"
                    className="block px-4 py-3 rounded-xl bg-gold-100 text-gold-700"
                  >
                    🎁 Jouer maintenant
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-3 rounded-xl hover:bg-cream-50 text-tea-700"
                  >
                    Mes gains
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-4 py-3 rounded-xl hover:bg-cream-50 text-tea-700"
                  >
                    Mon profil
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'employee') && (
                    <Link
                      to="/employee"
                      className="block px-4 py-3 rounded-xl hover:bg-cream-50 text-tea-700"
                    >
                      Espace Caissier
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-3 rounded-xl hover:bg-cream-50 text-tea-700"
                    >
                      Administration
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link to="/login" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button variant="gold" className="w-full">
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
