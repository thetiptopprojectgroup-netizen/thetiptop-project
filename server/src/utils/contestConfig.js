import ContestConfig from '../models/ContestConfig.js';

const DEFAULTS = {
  contest_start_date: new Date('2026-03-01'),
  contest_end_date: new Date('2026-03-30'),
  claim_end_date: new Date('2026-04-29'),
};

/**
 * Récupère les dates du concours depuis la config en base (définie par l'admin dans /admin).
 * Si aucune config n'existe, retourne les valeurs par défaut.
 */
export async function getContestDates() {
  const config = await ContestConfig.findOne().lean();
  if (!config?.contest_start_date || !config?.contest_end_date || !config?.claim_end_date) {
    return { ...DEFAULTS };
  }
  return {
    contest_start_date: new Date(config.contest_start_date),
    contest_end_date: new Date(config.contest_end_date),
    claim_end_date: new Date(config.claim_end_date),
  };
}
