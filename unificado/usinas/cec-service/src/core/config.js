require('dotenv').config();

function boolEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function intEnv(name, fallback, min, max) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(value, min), max);
}

const config = {
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  port: intEnv('PORT', 3086, 1, 65535),
  host: process.env.HOST || '127.0.0.1',
  databaseUrl: process.env.DATABASE_URL || '',
  database: {
    host: process.env.DATABASE_HOST || process.env.PGHOST || '127.0.0.1',
    port: intEnv('DATABASE_PORT', Number(process.env.PGPORT || 5432), 1, 65535),
    name: process.env.DATABASE_NAME || process.env.PGDATABASE || 'controle_est_concre_db',
    user: process.env.DATABASE_USER || process.env.PGUSER || 'controle_est_concre_user',
    password: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || '',
    poolSize: intEnv('DATABASE_POOL_SIZE', 5, 1, 20),
    idleTimeoutMs: intEnv('DATABASE_IDLE_TIMEOUT_MS', 30000, 1000, 300000),
    connectionTimeoutMs: intEnv('DATABASE_CONNECTION_TIMEOUT_MS', 5000, 500, 60000),
  },
  api: {
    maxLimit: intEnv('API_MAX_LIMIT', 5000, 1, 10000),
    defaultLimit: intEnv('API_DEFAULT_LIMIT', 1000, 1, 5000),
    cacheEnabled: boolEnv('API_CACHE_ENABLED', true),
    cacheTtlMs: intEnv('API_CACHE_TTL_MS', 30000, 1000, 600000),
  },
  googleSheets: {
    fallbackEnabled: boolEnv('GOOGLE_SHEETS_FALLBACK_ENABLED', false),
    apiUrl: process.env.GOOGLE_SHEETS_API_URL || '',
    timeoutMs: intEnv('GOOGLE_SHEETS_TIMEOUT_MS', 12000, 1000, 60000),
  },
  sheetReconciliation: {
    enabled: boolEnv('SHEET_RECONCILIATION_ENABLED', false),
    exportUrl: process.env.SHEET_RECONCILIATION_EXPORT_URL || '',
    targetUrl: process.env.SHEET_RECONCILIATION_TARGET_URL || 'http://127.0.0.1:3086/api/v1/rompimentos',
    pollingIntervalMs: intEnv('SHEET_RECONCILIATION_POLLING_INTERVAL_MS', 600000, 60000, 3600000),
    requestDelayMs: intEnv('SHEET_RECONCILIATION_REQUEST_DELAY_MS', 600, 0, 10000),
    timeoutMs: intEnv('SHEET_RECONCILIATION_TIMEOUT_MS', 20000, 1000, 60000),
    statePath: process.env.SHEET_RECONCILIATION_STATE_PATH || './data/sheet_sync_state.json',
  },
  security: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    rateLimitWindowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60000, 1000, 3600000),
    rateLimitMax: intEnv('RATE_LIMIT_MAX', 120, 1, 10000),
  },
  logLevel: process.env.LOG_LEVEL || 'INFO',
};

module.exports = { config };
