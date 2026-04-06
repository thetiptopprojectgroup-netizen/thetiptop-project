import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';
import { BrandLogoMark } from '../components/common/BrandLogo';
import SocialAuthSection from '../components/auth/SocialAuthSection';

const getAuthUser = () => useAuthStore.getState().user;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, isLoading } = useAuthStore();

  useEffect(() => {
    const err = searchParams.get('error');
    if (!err) return;
    const messages = {
      google_failed: 'Connexion Google impossible ou annulée. Réessayez.',
      facebook_failed: 'Connexion Facebook impossible ou annulée. Réessayez.',
      oauth_failed: 'La connexion a échoué. Réessayez.',
      oauth_error: 'Erreur lors de la connexion. Réessayez.',
    };
    const msg = messages[err] || 'Connexion impossible.';
    setLoginError(msg);
    toast.error(msg);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoginError(null);
    const result = await login(data.email, data.password);

    if (result.success) {
      toast.success('Connexion réussie ! 🎉');
      const dest = getAuthUser()?.role === 'admin' ? '/admin' : from;
      navigate(dest, { replace: true });
    } else {
      const msg = result.error || 'Connexion impossible. Réessayez.';
      setLoginError(msg);
      toast.error(msg);
    }
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
            <BrandLogoMark size="md" />
            <span className="font-display text-xl font-bold text-tea-900">Thé Tip Top</span>
          </Link>

          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Bon retour parmi nous ! 🍵
          </h1>
          <p className="text-tea-600 mb-2">
            Le plus simple : connectez-vous avec Google. Vous pouvez aussi utiliser votre e-mail
            ci-dessous.
          </p>
          <p className="mb-6 text-sm text-tea-500">
            Comme sur la plupart des sites, aucun mot de passe à saisir si vous choisissez Google.
          </p>

          <div className="mb-8">
            <SocialAuthSection googleLabel="Continuer avec Google" />
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-cream-50 text-tea-500">ou avec votre e-mail</span>
            </div>
          </div>

          {/* Form */}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-5"
          >
            {loginError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {loginError}
              </div>
            )}
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
