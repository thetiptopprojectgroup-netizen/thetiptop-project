import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareQuote, Star } from 'lucide-react';
import { reviewService } from '../../services/api';

function StarsRow({ rating }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? 'fill-gold-400 text-gold-500' : 'fill-cream-200 text-cream-300'}`}
          strokeWidth={1.2}
        />
      ))}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function GameReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setError(false);
    try {
      const { data } = await reviewService.getRecent();
      setReviews(data.data?.reviews || []);
    } catch {
      setError(true);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onRefresh = () => {
      load();
    };
    window.addEventListener('game-review-submitted', onRefresh);
    return () => window.removeEventListener('game-review-submitted', onRefresh);
  }, []);

  return (
    <section className="border-t border-gold-200/40 bg-gradient-to-b from-cream-50/95 to-white py-12 sm:py-14">
      <div className="container-wide">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-matcha-100 px-4 py-2 text-sm font-medium text-matcha-800">
            <MessageSquareQuote className="h-4 w-4" />
            Avis des joueurs
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-tea-900 sm:text-3xl">
            Ils ont joué avec nous
          </h2>
          <p className="mt-2 max-w-xl mx-auto text-tea-600 text-sm sm:text-base">
            Les cinq derniers avis publiés après une partie.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-matcha-500 border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-tea-500 text-sm">Impossible de charger les avis pour le moment.</p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <p className="text-center text-tea-600 max-w-md mx-auto">
            Aucun avis pour l&apos;instant. Validez un ticket et soyez le premier à partager votre expérience !
          </p>
        )}

        {!loading && !error && reviews.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {reviews.map((r, i) => (
              <motion.li
                key={r._id || `${r.pseudoAffiche}-${r.createdAt}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col rounded-2xl border border-cream-200 bg-white/90 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold text-tea-900 truncate">{r.pseudoAffiche}</span>
                  <StarsRow rating={r.rating} />
                </div>
                <p className="text-sm text-tea-700 leading-relaxed flex-1 line-clamp-6">{r.comment}</p>
                <time className="mt-3 text-xs text-tea-400" dateTime={r.createdAt}>
                  {formatDate(r.createdAt)}
                </time>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
