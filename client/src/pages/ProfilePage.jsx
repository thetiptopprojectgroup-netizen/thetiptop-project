import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, Save, Lock, Eye, EyeOff, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';
import { authService } from '../services/api';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || user.prenom || '',
        lastName: user.lastName || user.nom || '',
        email: user.email || '',
        phone: user.telephone || user.phone || '',
        dateOfBirth: user.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
        gender: user.sexe || '',
        address: user.adresse || '',
        city: user.ville || '',
        postalCode: user.code_postal || '',
        country: user.pays || 'France',
        marketingConsent: user.consentement_marketing || false,
        cookieConsent: user.consentement_cookies || false,
      });
    }
  }, [user, reset]);

  const onSubmitProfile = async (data) => {
    const result = await updateProfile({
      prenom: data.firstName,
      nom: data.lastName,
      telephone: data.phone,
      date_naissance: data.dateOfBirth || undefined,
      sexe: data.gender || undefined,
      adresse: data.address,
      ville: data.city,
      code_postal: data.postalCode,
      pays: data.country,
      consentement_marketing: data.marketingConsent,
      consentement_cookies: data.cookieConsent,
    });
    if (result.success) {
      toast.success('Profil mis à jour !');
    } else {
      toast.error(result.error);
    }
  };

  const onSubmitPassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.updatePassword({ currentPassword, newPassword });
      toast.success('Mot de passe modifié !');
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Informations', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'consent', label: 'Consentements', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-cream-50">
      <div className="container-wide max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">Mon profil</h1>
          <p className="text-tea-600">Gérez vos informations personnelles et vos préférences</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-matcha-600 text-white' : 'bg-white text-tea-700 hover:bg-cream-100'
                }`}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <Card.Header>
                <Card.Title>Informations personnelles</Card.Title>
                <Card.Description>Modifiez vos coordonnées et informations</Card.Description>
              </Card.Header>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Prénom" leftIcon={<User className="w-5 h-5" />} error={errors.firstName?.message}
                    {...register('firstName', { required: 'Requis' })} />
                  <Input label="Nom" error={errors.lastName?.message}
                    {...register('lastName', { required: 'Requis' })} />
                </div>
                <Input label="Email" type="email" leftIcon={<Mail className="w-5 h-5" />} disabled
                  {...register('email')} helperText="L'email ne peut pas être modifié" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Téléphone" leftIcon={<Phone className="w-5 h-5" />} placeholder="06 12 34 56 78"
                    {...register('phone')} />
                  <Input label="Date de naissance" type="date" leftIcon={<Calendar className="w-5 h-5" />}
                    {...register('dateOfBirth')} />
                </div>
                <div>
                  <label className="label">Genre</label>
                  <select className="input" {...register('gender')}>
                    <option value="">Non précisé</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="autre">Autre</option>
                    <option value="non_precise">Préfère ne pas dire</option>
                  </select>
                </div>
                <div className="border-t border-cream-200 pt-6">
                  <h3 className="font-display font-semibold text-tea-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Adresse
                  </h3>
                  <div className="space-y-4">
                    <Input label="Adresse" placeholder="123 Rue Example" {...register('address')} />
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Input label="Code postal" {...register('postalCode')} />
                      <Input label="Ville" {...register('city')} />
                      <Input label="Pays" {...register('country')} />
                    </div>
                  </div>
                </div>
                <Card.Footer>
                  <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />} disabled={!isDirty}>
                    Enregistrer
                  </Button>
                </Card.Footer>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <Card.Header>
                <Card.Title>Sécurité</Card.Title>
                <Card.Description>Modifiez votre mot de passe</Card.Description>
              </Card.Header>
              {user?.type_authentification !== 'local' ? (
                <div className="py-8 text-center text-tea-600">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Votre compte est connecté via {user.type_authentification === 'google' ? 'Google' : 'Facebook'}.</p>
                  <p className="text-sm mt-2">La gestion du mot de passe se fait via votre fournisseur d'identité.</p>
                </div>
              ) : (
                <form onSubmit={onSubmitPassword} className="space-y-5">
                  <Input label="Mot de passe actuel" name="currentPassword" type={showPassword ? 'text' : 'password'}
                    required leftIcon={<Lock className="w-5 h-5" />}
                    rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-tea-400 hover:text-tea-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>} />
                  <Input label="Nouveau mot de passe" name="newPassword" type="password" required
                    leftIcon={<Lock className="w-5 h-5" />}
                    helperText="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre" />
                  <Input label="Confirmer le nouveau mot de passe" name="confirmPassword" type="password" required
                    leftIcon={<Lock className="w-5 h-5" />} />
                  <Card.Footer>
                    <Button type="submit" variant="primary" isLoading={isChangingPassword}
                      leftIcon={<Lock className="w-4 h-4" />}>
                      Changer le mot de passe
                    </Button>
                  </Card.Footer>
                </form>
              )}
            </Card>
          </motion.div>
        )}

        {/* Consent Tab */}
        {activeTab === 'consent' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <Card.Header>
                <Card.Title>Consentements RGPD</Card.Title>
                <Card.Description>Gérez vos préférences de consentement</Card.Description>
              </Card.Header>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-start gap-4 p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded border-cream-300 text-matcha-600 focus:ring-matcha-500"
                      {...register('marketingConsent')} />
                    <div>
                      <div className="font-medium text-tea-900">Communications marketing</div>
                      <p className="text-sm text-tea-600 mt-1">
                        J'accepte de recevoir des offres, promotions et actualités de Thé Tip Top par email.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded border-cream-300 text-matcha-600 focus:ring-matcha-500"
                      {...register('cookieConsent')} />
                    <div>
                      <div className="font-medium text-tea-900">Cookies analytiques</div>
                      <p className="text-sm text-tea-600 mt-1">
                        J'accepte l'utilisation de cookies à des fins d'analyse et d'amélioration du service.
                      </p>
                    </div>
                  </label>
                  <div className="p-4 bg-matcha-50 rounded-xl">
                    <div className="font-medium text-tea-900 mb-1">Cookies essentiels</div>
                    <p className="text-sm text-tea-600">
                      Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.
                    </p>
                  </div>
                </div>
                {user?.date_consentement && (
                  <p className="text-sm text-tea-500">
                    Dernier consentement enregistré : {new Date(user.date_consentement).toLocaleDateString('fr-FR')}
                  </p>
                )}
                <Card.Footer>
                  <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                    Enregistrer mes préférences
                  </Button>
                </Card.Footer>
              </form>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
