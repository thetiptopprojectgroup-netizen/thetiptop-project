import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Leaf, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 8) { toast.error('Min. 8 caractères requis'); return; }
    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      localStorage.setItem('token', response.data.data.token);
      toast.success('Mot de passe réinitialisé !');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lien invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-full bg-matcha-600 flex items-center justify-center"><Leaf className="w-5 h-5 text-white" /></div>
          <span className="font-display text-xl font-bold text-tea-900">Thé Tip Top</span>
        </Link>
        <h1 className="text-2xl font-display font-bold text-tea-900 mb-2">Réinitialiser le mot de passe</h1>
        <p className="text-tea-600 mb-8">Choisissez un nouveau mot de passe sécurisé.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nouveau mot de passe" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-tea-400 hover:text-tea-600">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>} required />
          <Input label="Confirmer" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" leftIcon={<Lock className="w-5 h-5" />} required />
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>Réinitialiser</Button>
        </form>
      </motion.div>
    </div>
  );
}
