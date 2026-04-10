import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { newsletterService } from '../services/api';

export default function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('email');
    if (q) setEmail(q);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error('Adresse email invalide.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await newsletterService.unsubscribe(trimmed);
      toast.success(data.message || 'Désinscription enregistrée.');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-cream-50">
      <div className="container-wide max-w-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <Card.Header>
              <Card.Title as="h1">Se désinscrire de la newsletter</Card.Title>
              <Card.Description>
                Indiquez l’adresse email à retirer de notre liste. Aucun compte jeu n’est supprimé.
              </Card.Description>
            </Card.Header>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={loading} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Envoi…
                  </>
                ) : (
                  'Confirmer la désinscription'
                )}
              </Button>
            </form>
            <p className="text-sm text-tea-500 mt-4">
              Conformément au RGPD, vous pouvez aussi exercer vos droits depuis votre{' '}
              <Link to="/profile" className="text-matcha-600 hover:underline">
                profil
              </Link>{' '}
              si vous avez un compte.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-matcha-600 hover:underline mt-6 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l’accueil
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
