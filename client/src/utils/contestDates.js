/**
 * Normalise une date renvoyée par l'API (ISO string ou objet Date sérialisé).
 * @returns {string|undefined} ISO string utilisable pour new Date(), ou undefined si invalide
 */
export function toContestEndIso(raw) {
  if (raw == null || raw === '') return undefined;
  try {
    const d = raw instanceof Date ? raw : new Date(raw);
    const t = d.getTime();
    return Number.isFinite(t) ? d.toISOString() : undefined;
  } catch {
    return undefined;
  }
}
