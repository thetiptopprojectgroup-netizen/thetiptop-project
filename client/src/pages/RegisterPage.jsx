import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';
import { BrandLogoMark } from '../components/common/BrandLogo';
import SocialAuthSection from '../components/auth/SocialAuthSection';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password', '');

  const passwordRequirements = [
    { label: 'Au moins 8 caractères', valid: password.length >= 8 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Une minuscule', valid: /[a-z]/.test(password) },
    { label: 'Un chiffre', valid: /\d/.test(password) },
  ];

  const onSubmit = async (data) => {
    const result = await registerUser({
      ...data,
      acceptedTerms: true,
    });

    if (result.success) {
      toast.success('Inscription réussie ! Bienvenue 🎉');
      navigate('/play');
    } else {
      toast.error(result.error);
    }
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
          <Link to="/" className="flex items-center gap-2 mb-8">
            <BrandLogoMark size="md" />
            <span className="font-display text-xl font-bold text-tea-900">Thé Tip Top</span>
          </Link>

          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Créez votre compte 🌿
          </h1>
          <p className="text-tea-600 mb-2">
            Inscrivez-vous en un clic avec Google, ou remplissez le formulaire avec votre e-mail.
          </p>
          <p className="mb-6 text-sm text-tea-500">
            Google est proposé en premier, comme sur la plupart des sites.
          </p>

          <div className="mb-8">
            <SocialAuthSection
              googleLabel="S'inscrire avec Google"
              modalTitle="Inscription avec Google"
              modalDescription="Choisissez un compte Google enregistré sur cet appareil pour créer votre compte."
              onGoogleSuccess={() => {
                toast.success('Bienvenue ! 🎉');
                navigate('/play');
              }}
            />
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
