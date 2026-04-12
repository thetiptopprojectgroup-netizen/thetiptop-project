import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import StarRatingInput from './StarRatingInput';
import { reviewService } from '../../services/api';

export default function GameReviewForm({ initialPseudo = '', onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pseudo, setPseudo] = useState(initialPseudo);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPseudo(initialPseudo || '');
  }, [initialPseudo]);

  const needsPseudo = !initialPseudo?.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      toast.error('Votre avis doit contenir au moins 10 caractères.');
      return;
    }
    if (needsPseudo && !pseudo.trim()) {
      toast.error('Indiquez un pseudo pour afficher votre avis.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        rating,
        comment: comment.trim(),
        ...(needsPseudo ? { pseudo: pseudo.trim() } : {}),
      };
      const { data } = await reviewService.create(payload);
      toast.success(data.message || 'Merci pour votre avis !');
      onSuccess?.(data.data?.user);
      window.dispatchEvent(new CustomEvent('game-review-submitted'));
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Impossible d'envoyer votre avis.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-gold-200/80 bg-white p-5 text-left shadow-inner"
    >
      <h3 className="font-display text-lg font-semibold text-tea-900 mb-1">Votre avis sur le jeu</h3>
      <p className="text-sm text-tea-600 mb-4">
        Une note et quelques mots aident les autres joueurs. Un seul avis par compte.
      </p>

      <label className="block text-sm font-medium text-tea-800 mb-2">Note</label>
      <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />

      {needsPseudo && (
        <div className="mt-4">
          <label htmlFor="review-pseudo" className="block text-sm font-medium text-tea-800 mb-1">
            Pseudo affiché
          </label>
          <input
            id="review-pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={32}
            autoComplete="nickname"
            placeholder="Ex. Marie_Nice"
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-2.5 text-tea-900 placeholder:text-tea-400 focus:border-matcha-400 focus:outline-none focus:ring-2 focus:ring-matcha-100"
          />
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="review-comment" className="block text-sm font-medium text-tea-800 mb-1">
          Votre avis
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Dites-nous ce que vous avez pensé du jeu…"
          className="w-full resize-y rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-tea-900 placeholder:text-tea-400 focus:border-matcha-400 focus:outline-none focus:ring-2 focus:ring-matcha-100"
        />
        <p className="mt-1 text-xs text-tea-500">{comment.length}/500 — minimum 10 caractères</p>
      </div>

      <Button type="submit" variant="gold" className="mt-4 w-full sm:w-auto" disabled={submitting}>
        {submitting ? 'Envoi…' : 'Publier mon avis'}
      </Button>
    </form>
  );
}
