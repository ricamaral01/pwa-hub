const { config } = require('../core/config');
const { MemoryCache } = require('../core/cache');
const repository = require('../repositories/rompimentos_repository');
const { fetchGoogleSheetsRows } = require('./google_sheets_service');
const { log } = require('../core/logger');

const cache = new MemoryCache();

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRow(row) {
  return {
    data_moldagem: formatDate(row.data_moldagem),
    data_ruptura: formatDate(row.data_ruptura),
    traco_id: row.traco_id ? String(row.traco_id) : '',
    idade_dias: toNumber(row.idade_dias),
    cp: toNumber(row.cp),
    mpa: toNumber(row.mpa),
  };
}

function cacheKey(filters) {
  return `controle_estatistico:${JSON.stringify(filters)}`;
}

function buildResponse(rows, filters, source, warning) {
  const pageRows = rows.slice(0, filters.limit).map(normalizeRow);
  const response = {
    success: true,
    source,
    generated_at: new Date().toISOString(),
    count: pageRows.length,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      has_more: rows.length > filters.limit,
    },
    rows: pageRows,
  };
  if (warning) response.warning = warning;
  return response;
}

async function listRompimentosGrupos(filters, requestId) {
  const key = cacheKey(filters);
  if (config.api.cacheEnabled) {
    const cached = cache.get(key);
    if (cached) {
      return Object.assign({}, cached, {
        source: 'server_cache',
        generated_at: new Date().toISOString(),
      });
    }
  }

  try {
    const started = Date.now();
    const rows = await repository.listRompimentos(filters);
    log('INFO', 'database_query_completed', {
      request_id: requestId,
      duration_ms: Date.now() - started,
      count: rows.length,
    });
    const response = buildResponse(rows, filters, 'database');
    if (config.api.cacheEnabled) cache.set(key, response, config.api.cacheTtlMs);
    return response;
  } catch (error) {
    log('ERROR', 'database_query_failed', {
      request_id: requestId,
      error: error.message,
    });
    if (!config.googleSheets.fallbackEnabled) {
      const unavailable = new Error('Fonte de dados temporariamente indisponivel.');
      unavailable.status = 503;
      unavailable.code = 'DATA_SOURCE_UNAVAILABLE';
      throw unavailable;
    }
    const fallbackRows = await fetchGoogleSheetsRows(filters, config.googleSheets);
    return buildResponse(
      fallbackRows,
      filters,
      'google_sheets_fallback',
      'A fonte principal de dados esta temporariamente indisponivel.'
    );
  }
}

module.exports = {
  buildResponse,
  cache,
  listRompimentosGrupos,
  normalizeRow,
};
