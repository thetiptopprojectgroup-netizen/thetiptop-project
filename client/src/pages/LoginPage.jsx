<<<<<<< HEAD
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';

const getAuthUser = () => useAuthStore.getState().user;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    
    if (result.success) {
      toast.success('Connexion réussie ! 🎉');
      const dest = getAuthUser()?.role === 'admin' ? '/admin' : from;
      navigate(dest, { replace: true });
    } else {
      toast.error(result.error);
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-matcha-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-tea-900">Thé Tip Top</span>
          </Link>

          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Bon retour parmi nous ! 🍵
          </h1>
          <p className="text-tea-600 mb-8">
            Connectez-vous pour participer au jeu-concours
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-cream-300 rounded-xl hover:bg-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

            <button
              onClick={() => handleOAuth('facebook')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-cream-300 rounded-xl hover:bg-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continuer avec Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-cream-50 text-tea-500">ou avec votre email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'L\'email est requis',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email invalide',
                },
              })}
            />

            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-tea-400 hover:text-tea-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', {
                required: 'Le mot de passe est requis',
              })}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-cream-300 text-matcha-600 focus:ring-matcha-500" />
                <span className="text-tea-600">Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="text-matcha-600 hover:text-matcha-700 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <p className="mt-8 text-center text-tea-600">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-matcha-600 hover:text-matcha-700 font-medium">
              S'inscrire gratuitement
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-matcha-600 to-matcha-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-center text-white max-w-md"
        >
          <div className="text-6xl mb-6">🎁</div>
          <h2 className="text-3xl font-display font-bold mb-4">
            100% des tickets sont gagnants !
          </h2>
          <p className="text-cream-200 text-lg">
            Participez au grand jeu-concours Thé Tip Top et remportez des lots exceptionnels.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
=======
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const emailValue = watch('email', '');
  const passwordValue = watch('password', '');
  useEffect(() => {
    setLoginError(null);
  }, [emailValue, passwordValue]);

  const onSubmit = async (data) => {
    setLoginError(null);
    const apiBase = import.meta.env.VITE_API_URL ?? '/api';
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Connexion réussie ! 🎉');
        navigate(from, { replace: true });
      } else {
        setLoginError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la connexion';
      setLoginError(message);
      toast.error(message);
    }
  };

  const handleOAuth = (provider) => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    // Sous-domaine API pour éviter 404 quand l’ingress ne route pas /api vers le backend
    const apiOrigin =
      origin.startsWith('https://dev.') ? origin.replace('https://dev.', 'https://api.dev.') :
      origin.startsWith('https://preprod.') ? origin.replace('https://preprod.', 'https://api.preprod.') :
      origin === 'https://www.thetiptop-jeu.fr' || origin === 'https://thetiptop-jeu.fr' ? 'https://api.thetiptop-jeu.fr' :
      origin;
    const path = apiOrigin !== origin ? '/auth' : '/api/auth';
    window.location.href = `${apiOrigin}${path}/${provider}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-8">
            <Logo />
          </div>

          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Bon retour parmi nous ! 🍵
          </h1>
          <p className="text-tea-600 mb-8">
            Connectez-vous pour participer au jeu-concours
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-cream-300 rounded-xl hover:bg-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

            <button
              onClick={() => handleOAuth('facebook')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-cream-300 rounded-xl hover:bg-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continuer avec Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-cream-50 text-tea-500">ou avec votre email</span>
            </div>
          </div>

          {/* Message d'erreur de connexion */}
          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3" role="alert">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{loginError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'L\'email est requis',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email invalide',
                },
              })}
            />

            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-tea-400 hover:text-tea-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', {
                required: 'Le mot de passe est requis',
              })}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-cream-300 text-matcha-600 focus:ring-matcha-500" />
                <span className="text-tea-600">Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="text-matcha-600 hover:text-matcha-700 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <p className="mt-8 text-center text-tea-600">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-matcha-600 hover:text-matcha-700 font-medium">
              S'inscrire gratuitement
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-matcha-600 to-matcha-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-center text-white max-w-md"
        >
          <div className="text-6xl mb-6">🎁</div>
          <h2 className="text-3xl font-display font-bold mb-4">
            100% des tickets sont gagnants !
          </h2>
          <p className="text-cream-200 text-lg">
            Participez au grand jeu-concours Thé Tip Top et remportez des lots exceptionnels.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
>>>>>>> origin/vpreprod
