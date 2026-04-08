import {
  observePlayButtonToResult,
  recordPlayButtonClick,
  recordPlayButtonOutcome,
} from '../monitoring/metrics.js';

const ALLOWED_PAGES = new Set(['play']);
const ALLOWED_OUTCOMES = new Set(['success', 'failure', 'error', 'unknown']);

export const trackPlayButton = async (req, res) => {
  const { event, page = 'play', outcome = 'unknown', durationSeconds } = req.body || {};

  const safePage = ALLOWED_PAGES.has(page) ? page : 'play';

  if (event === 'click') {
    recordPlayButtonClick(safePage);
    return res.status(202).json({ success: true });
  }

  if (event === 'result') {
    const safeOutcome = ALLOWED_OUTCOMES.has(outcome) ? outcome : 'unknown';
    recordPlayButtonOutcome(safePage, safeOutcome);
    observePlayButtonToResult(safePage, safeOutcome, Number(durationSeconds));
    return res.status(202).json({ success: true });
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid telemetry event',
  });
};
