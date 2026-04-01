import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Leaf, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch (error) {
      toast.error('Une erreur est survenue');
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

        {isSent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-matcha-100 flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-matcha-600" /></div>
            <h1 className="text-2xl font-display font-bold text-tea-900 mb-4">Email envoyé !</h1>
            <p className="text-tea-600 mb-8">Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation.</p>
            <Link to="/login"><Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>Retour à la connexion</Button></Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold text-tea-900 mb-2">Mot de passe oublié ?</h1>
            <p className="text-tea-600 mb-8">Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="w-5 h-5" />} required />
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>Envoyer le lien</Button>
            </form>
            <p className="mt-6 text-center">
              <Link to="/login" className="text-matcha-600 hover:text-matcha-700 font-medium flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Retour à la connexion</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
