import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerErrorsList, setRegisterErrorsList] = useState([]);
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password', '');
  const emailValue = watch('email', '');
  const firstNameValue = watch('firstName', '');
  const lastNameValue = watch('lastName', '');

  useEffect(() => {
    setRegisterError(null);
    setRegisterErrorsList([]);
  }, [emailValue, firstNameValue, lastNameValue, password]);

  const passwordRequirements = [
    { label: 'Au moins 8 caractères', valid: password.length >= 8 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Une minuscule', valid: /[a-z]/.test(password) },
    { label: 'Un chiffre', valid: /\d/.test(password) },
  ];

  const onSubmit = async (data) => {
    setRegisterError(null);
    setRegisterErrorsList([]);
    try {
      const result = await registerUser({
        ...data,
        acceptedTerms: true,
      });

      if (result.success) {
        toast.success('Inscription réussie ! Bienvenue 🎉');
        navigate('/play');
      } else {
        setRegisterError(result.error);
        if (result.errors?.length) {
          setRegisterErrorsList(result.errors.map((e) => e.message || e.msg));
        }
        toast.error(result.error);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la création du compte';
      const list = err?.response?.data?.errors?.map((e) => e.message || e.msg) || [];
      setRegisterError(message);
      setRegisterErrorsList(list);
      toast.error(message);
    }
  };

  const handleOAuth = (provider) => {
    // Toujours rediriger vers l’origine actuelle + /api/auth/… pour éviter 404 (SPA / proxy)
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${base}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gold-500 to-gold-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-center text-white max-w-md"
        >
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-3xl font-display font-bold mb-4">
            Rejoignez l'aventure Thé Tip Top
          </h2>
          <p className="text-cream-100 text-lg mb-8">
            Inscrivez-vous gratuitement et participez immédiatement au jeu-concours.
          </p>
          <div className="space-y-3 text-left bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-matcha-300" />
              <span>100% des tickets gagnants</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-matcha-300" />
              <span>5 lots exceptionnels à remporter</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-matcha-300" />
              <span>Tirage au sort pour 1 an de thé</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Logo */}
          <div className="mb-8">
            <Logo />
          </div>

          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Créez votre compte 🌿
          </h1>
          <p className="text-tea-600 mb-8">
            Inscrivez-vous pour participer au jeu-concours
          </p>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-cream-300 rounded-xl hover:bg-cream-50 transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth('facebook')}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-cream-300 rounded-xl hover:bg-cream-50 transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
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

          {/* Message d'erreur à l'inscription */}
          {registerError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200" role="alert">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{registerError}</p>
                  {registerErrorsList.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-sm text-red-700 space-y-1">
                      {registerErrorsList.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Jean"
                leftIcon={<User className="w-5 h-5" />}
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'Requis',
                  maxLength: { value: 50, message: 'Max 50 caractères' },
                })}
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Requis',
                  maxLength: { value: 50, message: 'Max 50 caractères' },
                })}
              />
            </div>

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

            <div>
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
                  minLength: { value: 8, message: 'Min 8 caractères' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Format invalide',
                  },
                })}
              />
              {/* Password requirements */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.label}
                    className={`flex items-center gap-2 text-xs ${
                      req.valid ? 'text-matcha-600' : 'text-tea-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        req.valid ? 'bg-matcha-100' : 'bg-cream-200'
                      }`}
                    >
                      {req.valid && <Check className="w-3 h-3" />}
                    </div>
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-cream-300 text-matcha-600 focus:ring-matcha-500"
                  {...register('acceptedTerms', {
                    required: 'Vous devez accepter les CGU',
                  })}
                />
                <span className="text-sm text-tea-600">
                  J'accepte les{' '}
                  <Link to="/terms" className="text-matcha-600 hover:underline">
                    conditions générales d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link to="/privacy" className="text-matcha-600 hover:underline">
                    politique de confidentialité
                  </Link>
                  . *
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="text-red-500 text-sm">{errors.acceptedTerms.message}</p>
              )}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-cream-300 text-matcha-600 focus:ring-matcha-500"
                  {...register('marketingConsent')}
                />
                <span className="text-sm text-tea-600">
                  J'accepte de recevoir des offres et actualités par email
                </span>
              </label>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" isLoading={isLoading}>
              Créer mon compte
            </Button>
          </form>

          <p className="mt-8 text-center text-tea-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-matcha-600 hover:text-matcha-700 font-medium">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
