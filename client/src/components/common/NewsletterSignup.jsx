import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { newsletterService } from '../../services/api.js';

export default function NewsletterSignup({ source = 'footer', className = '' }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Veuillez saisir votre adresse email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error('Veuillez saisir une adresse email valide.');
      return;
    }
    if (!consent) {
      toast.error('Veuillez accepter de recevoir la newsletter.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await newsletterService.subscribe(trimmed, consent, source);
      toast.success(data.message || 'Inscription réussie !');
      setEmail('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue. Réessayez plus tard.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <h3 className="font-display font-semibold text-lg text-white mb-3">
        Newsletter
      </h3>
      <p className="text-cream-300 text-sm mb-4">
        Restez informé des actualités du jeu-concours et des lots à gagner.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-l-lg bg-tea-800 text-matcha-400 shrink-0">
            <Mail className="w-5 h-5" />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.fr"
            disabled={isLoading}
            className="flex-1 h-10 px-3 rounded-r-lg bg-tea-800/80 border border-tea-700 text-cream-100 placeholder-cream-500 focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent disabled:opacity-60"
            aria-label="Adresse email pour la newsletter"
          />
        </div>
        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={isLoading}
            className="mt-1 rounded border-tea-600 text-matcha-500 focus:ring-matcha-500"
          />
          <span className="text-cream-400 text-xs group-hover:text-cream-300">
            J'accepte de recevoir la newsletter Thé Tip Top (jeu-concours, lots, actualités). Je peux me désinscrire à tout moment.
          </span>
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 rounded-lg bg-matcha-600 hover:bg-matcha-500 text-white font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Inscription…
            </>
          ) : (
            "S'inscrire"
          )}
        </button>
      </form>
    </div>
  );
}
