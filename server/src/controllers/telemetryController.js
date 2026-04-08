import {
  recordHowToPlayPageView,
  observePlayButtonToResult,
  recordHowToPlayClick,
  recordPlayButtonClick,
  recordPlayButtonOutcome,
  recordRulesPageView,
} from '../monitoring/metrics.js';

const ALLOWED_PAGES = new Set(['play']);
const ALLOWED_OUTCOMES = new Set(['success', 'failure', 'error', 'unknown']);
const ALLOWED_SOURCES = new Set([
  'header_desktop',
  'header_mobile',
  'footer',
  'rules_page',
  'how_it_works_page',
  'unknown',
]);

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

export const trackEvent = async (req, res) => {
  const { event, source = 'unknown' } = req.body || {};
  const safeSource = ALLOWED_SOURCES.has(source) ? source : 'unknown';

  if (event === 'how_to_play_click') {
    recordHowToPlayClick(safeSource);
    return res.status(202).json({ success: true });
  }

  if (event === 'how_to_play_view') {
    recordHowToPlayPageView(safeSource);
    return res.status(202).json({ success: true });
  }

  if (event === 'rules_view') {
    recordRulesPageView(safeSource);
    return res.status(202).json({ success: true });
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid telemetry event',
  });
};
