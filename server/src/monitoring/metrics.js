import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'thetiptop_',
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'thetiptop_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'thetiptop_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestsInFlight = new client.Gauge({
  name: 'thetiptop_http_requests_in_flight',
  help: 'Current in-flight HTTP requests',
  registers: [register],
});

const authRequestsTotal = new client.Counter({
  name: 'thetiptop_auth_requests_total',
  help: 'Authentication traffic by action and outcome',
  labelNames: ['action', 'outcome'],
  registers: [register],
});

const authJwtFailuresTotal = new client.Counter({
  name: 'thetiptop_auth_jwt_failures_total',
  help: 'JWT authentication failures',
  labelNames: ['reason'],
  registers: [register],
});

const mongoConnectionState = new client.Gauge({
  name: 'thetiptop_mongodb_connection_state',
  help: 'MongoDB connection state (1=connected, 0=disconnected)',
  registers: [register],
});

const ticketsValidatedTotal = new client.Counter({
  name: 'thetiptop_tickets_validated_total',
  help: 'Ticket validation attempts',
  labelNames: ['outcome'],
  registers: [register],
});

const ticketClaimsTotal = new client.Counter({
  name: 'thetiptop_ticket_claims_total',
  help: 'Ticket claim operations',
  labelNames: ['channel', 'outcome'],
  registers: [register],
});

const newsletterActionsTotal = new client.Counter({
  name: 'thetiptop_newsletter_actions_total',
  help: 'Newsletter actions',
  labelNames: ['action', 'outcome'],
  registers: [register],
});

const grandPrizeDrawTotal = new client.Counter({
  name: 'thetiptop_grand_prize_draw_total',
  help: 'Grand prize draw attempts',
  labelNames: ['outcome'],
  registers: [register],
});

const playButtonClicksTotal = new client.Counter({
  name: 'thetiptop_play_button_clicks_total',
  help: 'Play button clicks from the play page',
  labelNames: ['page'],
  registers: [register],
});

const playButtonOutcomesTotal = new client.Counter({
  name: 'thetiptop_play_button_outcomes_total',
  help: 'Outcome after clicking the play button',
  labelNames: ['page', 'outcome'],
  registers: [register],
});

const playButtonToResultSeconds = new client.Histogram({
  name: 'thetiptop_play_button_to_result_seconds',
  help: 'Time from play button click to validation result',
  labelNames: ['page', 'outcome'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 3, 5, 8, 13],
  registers: [register],
});

const howToPlayClicksTotal = new client.Counter({
  name: 'thetiptop_how_to_play_clicks_total',
  help: 'Clicks on "Comment jouer" navigation links',
  labelNames: ['source'],
  registers: [register],
});

const rulesPageViewsTotal = new client.Counter({
  name: 'thetiptop_rules_page_views_total',
  help: 'Views of game rules page',
  labelNames: ['source'],
  registers: [register],
});

const howToPlayPageViewsTotal = new client.Counter({
  name: 'thetiptop_how_to_play_page_views_total',
  help: 'Views of "Comment jouer" page',
  labelNames: ['source'],
  registers: [register],
});

const normalizePath = (pathValue) => {
  if (!pathValue) return '/unknown';
  return pathValue
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id')
    .replace(/\/[0-9a-fA-F-]{36}(?=\/|$)/g, '/:uuid')
    .replace(/\/[A-Z0-9]{10}(?=\/|$)/g, '/:ticket_code')
    .replace(/\/[^/]+@[^/]+(?=\/|$)/g, '/:email')
    .replace(/\/\d+(?=\/|$)/g, '/:num');
};

const toRouteLabel = (req) => {
  const sourcePath = req.baseUrl ? `${req.baseUrl}${req.path || ''}` : req.path || req.originalUrl || '/unknown';
  const noQuery = sourcePath.split('?')[0];
  return normalizePath(noQuery);
};

export const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime.bigint();
  httpRequestsInFlight.inc();

  res.on('finish', () => {
    const route = toRouteLabel(req);
    const method = req.method;
    const statusCode = String(res.statusCode);
    const elapsedSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDurationSeconds.observe(
      { method, route, status_code: statusCode },
      elapsedSeconds
    );
    httpRequestsInFlight.dec();
  });

  next();
};

export const metricsHandler = async (req, res, next) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
};

export const setMongoConnectionState = (isConnected) => {
  mongoConnectionState.set(isConnected ? 1 : 0);
};

export const recordJwtFailure = (reason) => {
  authJwtFailuresTotal.inc({ reason });
};

export const recordAuthRequest = (action, outcome) => {
  authRequestsTotal.inc({ action, outcome });
};

export const recordTicketValidation = (outcome) => {
  ticketsValidatedTotal.inc({ outcome });
};

export const recordTicketClaim = (channel, outcome) => {
  ticketClaimsTotal.inc({ channel, outcome });
};

export const recordNewsletterAction = (action, outcome) => {
  newsletterActionsTotal.inc({ action, outcome });
};

export const recordGrandPrizeDraw = (outcome) => {
  grandPrizeDrawTotal.inc({ outcome });
};

export const recordPlayButtonClick = (page = 'play') => {
  playButtonClicksTotal.inc({ page });
};

export const recordPlayButtonOutcome = (page = 'play', outcome = 'unknown') => {
  playButtonOutcomesTotal.inc({ page, outcome });
};

export const observePlayButtonToResult = (
  page = 'play',
  outcome = 'unknown',
  durationSeconds = 0
) => {
  if (Number.isFinite(durationSeconds) && durationSeconds >= 0) {
    playButtonToResultSeconds.observe({ page, outcome }, durationSeconds);
  }
};

export const recordHowToPlayClick = (source = 'unknown') => {
  howToPlayClicksTotal.inc({ source });
};

export const recordRulesPageView = (source = 'unknown') => {
  rulesPageViewsTotal.inc({ source });
};

export const recordHowToPlayPageView = (source = 'unknown') => {
  howToPlayPageViewsTotal.inc({ source });
};

export { register };
