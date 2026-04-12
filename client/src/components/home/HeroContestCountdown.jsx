import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, Ticket } from 'lucide-react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ticketsValidatedSentence(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  const f = n.toLocaleString('fr-FR');
  if (n === 0) return "Aucun ticket validé pour l'instant";
  if (n === 1) return '1 ticket déjà validé';
  return `${f} tickets déjà validés`;
}

/**
 * Compte à rebours jusqu'à la fin du jeu (dates.end depuis /api/contest-info).
 * validatedTicketsCount : codes en état utilisé / réclamé (rafraîchi côté page).
 */
export default function HeroContestCountdown({ endDateIso, status, isLoading, validatedTicketsCount }) {
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
      <div className="mb-3 rounded-lg border border-white/15 bg-white/5 px-2.5 py-2.5 backdrop-blur-md sm:mb-4 sm:rounded-xl sm:px-3 sm:py-3.5">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10 sm:h-5 sm:w-40" />
        <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-2.5 sm:gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-white/10 sm:h-14" />
          ))}
        </div>
      </div>
    );
  }

  /* Pas de date de fin exploitable après chargement : éviter le « trou » visuel (souvent API ou parsing) */
  if (endMs == null) {
    return (
      <div className="mb-3 max-w-3xl rounded-xl border border-amber-400/30 bg-amber-950/30 px-3 py-2.5 text-center backdrop-blur-md sm:mb-4 sm:px-4 sm:py-3 md:text-left">
        <p className="text-xs text-amber-100/95 sm:text-sm">
          Compte à rebours indisponible : les dates du concours n&apos;ont pas pu être chargées. Vérifiez votre
          connexion ou que l&apos;API répond <code className="rounded bg-black/20 px-1">/api/contest-info</code>.
        </p>
      </div>
    );
  }

  const diff = Math.max(0, endMs - now);
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const ended = diff === 0 || status === 'ended';
  const ticketsLine = ticketsValidatedSentence(validatedTicketsCount);

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
        className="mb-3 rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-center backdrop-blur-md sm:mb-4 sm:rounded-xl sm:px-4 sm:py-4 md:px-6"
      >
        <div className="flex items-center justify-center gap-2 text-cream-100">
          <Timer className="h-5 w-5 text-gold-400" />
          <span className="text-base font-semibold md:text-lg">Le jeu-concours est terminé</span>
        </div>
        <p className="mt-1.5 text-sm text-cream-200/90">Merci à tous les participants !</p>
        {ticketsLine && (
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/15 pt-3 text-cream-100">
            <Ticket className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <p className="text-sm font-medium md:text-base">{ticketsLine}</p>
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
      className="mb-3 w-full max-w-md sm:mb-4"
    >
      <p className="mb-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-gold-300/95 drop-shadow sm:mb-2 sm:text-xs md:text-left">
        Fin du jeu dans
      </p>
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 md:gap-2">
        {units.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-lg border border-white/20 bg-matcha-950/40 px-0.5 py-1.5 shadow-md backdrop-blur-md sm:rounded-xl sm:px-1 sm:py-2"
          >
            <span
              className="font-display text-lg font-bold tabular-nums tracking-tight text-white drop-shadow-md sm:text-xl md:text-2xl"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </span>
            <span className="mt-0.5 text-center text-[0.5rem] font-medium uppercase leading-tight tracking-wide text-cream-200/90 sm:text-[0.55rem]">
              {label}
            </span>
          </div>
        ))}
      </div>
      {ticketsLine && (
        <motion.div
          key={validatedTicketsCount}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 border-t border-white/15 pt-2 text-cream-100 sm:mt-2.5 sm:justify-start sm:gap-2 sm:pt-2.5"
        >
          <Ticket className="h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" aria-hidden />
          <p className="text-center text-[0.7rem] font-semibold leading-tight sm:text-left sm:text-sm md:text-base">{ticketsLine}</p>
          <span className="hidden text-[0.6rem] text-cream-300/80 sm:inline">(temps réel)</span>
        </motion.div>
      )}
    </motion.div>
  );
}
