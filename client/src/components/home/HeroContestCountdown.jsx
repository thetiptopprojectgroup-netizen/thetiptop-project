import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, Users } from 'lucide-react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function playersSentence(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  const f = n.toLocaleString('fr-FR');
  if (n === 0) return "Aucun joueur n'a encore participé";
  if (n === 1) return '1 joueur a déjà participé';
  return `${f} joueurs ont déjà participé`;
}

/**
 * Compte à rebours jusqu'à la fin du jeu (dates.end depuis /api/contest-info).
 * playersCount : nombre de personnes distinctes ayant validé au moins un ticket (rafraîchi côté page).
 */
export default function HeroContestCountdown({ endDateIso, status, isLoading, playersCount }) {
  const endMs = useMemo(() => {
    if (!endDateIso) return null;
    const t = new Date(endDateIso).getTime();
    return Number.isFinite(t) ? t : null;
  }, [endDateIso]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endMs == null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (isLoading) {
    return (
      <div className="mb-8 rounded-2xl border border-white/15 bg-white/5 px-4 py-6 backdrop-blur-md md:px-6 md:py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (endMs == null) {
    return null;
  }

  const diff = Math.max(0, endMs - now);
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const ended = diff === 0 || status === 'ended';
  const playerLine = playersSentence(playersCount);

  const units = [
    { label: 'Jours', value: days, show: true },
    { label: 'Heures', value: pad2(hours), show: true },
    { label: 'Minutes', value: pad2(minutes), show: true },
    { label: 'Secondes', value: pad2(seconds), show: true },
  ];

  if (ended) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border border-white/20 bg-white/10 px-5 py-6 text-center backdrop-blur-md md:px-8 md:py-7"
      >
        <div className="flex items-center justify-center gap-2 text-cream-100">
          <Timer className="h-6 w-6 text-gold-400" />
          <span className="text-lg font-semibold md:text-xl">Le jeu-concours est terminé</span>
        </div>
        <p className="mt-2 text-sm text-cream-200/90">Merci à tous les participants !</p>
        {playerLine && (
          <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/15 pt-4 text-cream-100">
            <Users className="h-5 w-5 shrink-0 text-gold-400" aria-hidden />
            <p className="text-base font-medium md:text-lg">{playerLine}</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 w-full max-w-3xl"
    >
      <p className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-gold-300/95 drop-shadow md:text-left md:text-base">
        Fin du jeu dans
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {units.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-matcha-950/40 px-2 py-4 shadow-lg backdrop-blur-md sm:py-5"
          >
            <span
              className="font-display text-4xl font-bold tabular-nums tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </span>
            <span className="mt-2 text-center text-[0.65rem] font-medium uppercase tracking-wide text-cream-200/90 sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
      {playerLine && (
        <motion.div
          key={playersCount}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          className="mt-5 flex flex-col items-center gap-1 border-t border-white/15 pt-4 sm:flex-row sm:justify-center sm:gap-3 md:justify-start"
        >
          <div className="flex items-center gap-2 text-cream-100">
            <Users className="h-5 w-5 shrink-0 text-gold-400" aria-hidden />
            <p className="text-center text-base font-semibold md:text-left md:text-lg">{playerLine}</p>
          </div>
          <span className="text-xs text-cream-300/80">(temps réel)</span>
        </motion.div>
      )}
    </motion.div>
  );
}
