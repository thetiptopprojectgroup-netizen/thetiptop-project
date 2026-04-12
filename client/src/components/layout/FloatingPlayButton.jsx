import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const HIDDEN_PREFIXES = ['/play', '/admin', '/employee'];

export default function FloatingPlayButton() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  const to = isAuthenticated ? '/play' : '/register';

  return (
    <motion.div
      className="pointer-events-none fixed bottom-5 right-4 z-40 flex justify-end sm:bottom-6 sm:right-6"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Link
        to={to}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-semibold text-tea-950 shadow-lg shadow-gold-900/25 transition hover:from-gold-400 hover:to-gold-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 sm:px-5 sm:py-3 sm:text-base"
        aria-label={isAuthenticated ? 'Jouer au jeu-concours' : "S'inscrire pour jouer"}
      >
        <Sparkles className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
        Jouer
      </Link>
    </motion.div>
  );
}
