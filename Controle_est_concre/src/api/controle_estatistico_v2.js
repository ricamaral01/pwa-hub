const express = require('express');
const { parseQuery } = require('../schemas/controle_estatistico');
const { listRompimentosGrupos, listEstatisticaDiaria, listEstatisticaMensal } = require('../repositories/analytics_repository');
const { analyticsCache } = require('../core/analytics_cache');
const { config } = require('../core/config');

const router = express.Router();

const CACHE_TTL_MS = Number(process.env.API_CACHE_TTL_MS || 30000);
const CACHE_ENABLED = process.env.API_CACHE_ENABLED === 'true' || process.env.API_CACHE_ENABLED === undefined;

function getCacheKey(route, parsedFilters) {
  const queryStr = Object.entries(parsedFilters)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `v2:${route}:${queryStr}`;
}

function getAffectedMonths(parsedFilters) {
  if (parsedFilters.ano && parsedFilters.mes) {
    return [`${parsedFilters.ano}-${String(parsedFilters.mes).padStart(2, '0')}`];
  }
  if (parsedFilters.data_inicio || parsedFilters.data_fim) {
    const months = [];
    const startStr = parsedFilters.data_inicio || '2020-01-01';
    const endStr = parsedFilters.data_fim || '2040-12-31';
    const start = new Date(startStr);
    const end = new Date(endStr);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const yr = current.getFullYear();
      const mo = String(current.getMonth() + 1).padStart(2, '0');
      months.push(`${yr}-${mo}`);
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }
  return []; // Global query
}

router.get('/rompimentos-grupos', async (req, res, next) => {
  try {
    const filters = parseQuery(req.query, config);
    const cacheKey = getCacheKey('rompimentos-grupos', filters);

    if (CACHE_ENABLED) {
      const cached = analyticsCache.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    }

    const rows = await listRompimentosGrupos(filters);
    const hasMore = rows.length > filters.limit;
    if (hasMore) {
      rows.pop(); // Remove the lookahead row
    }

    const payload = {
      success: true,
      source: 'postgresql_analytics',
      count: rows.length,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        has_more: hasMore
      },
      rows
    };

    if (CACHE_ENABLED) {
      const affected = getAffectedMonths(filters);
      analyticsCache.set(cacheKey, payload, CACHE_TTL_MS, affected);
    }

    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get('/estatistica-diaria', async (req, res, next) => {
  try {
    const filters = parseQuery(req.query, config);
    const cacheKey = getCacheKey('estatistica-diaria', filters);

    if (CACHE_ENABLED) {
      const cached = analyticsCache.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    }

    const rows = await listEstatisticaDiaria(filters);
    const payload = {
      success: true,
      source: 'postgresql_analytics',
      count: rows.length,
      rows
    };

    if (CACHE_ENABLED) {
      const affected = getAffectedMonths(filters);
      analyticsCache.set(cacheKey, payload, CACHE_TTL_MS, affected);
    }

    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get('/estatistica-mensal', async (req, res, next) => {
  try {
    const filters = parseQuery(req.query, config);
    const cacheKey = getCacheKey('estatistica-mensal', filters);

    if (CACHE_ENABLED) {
      const cached = analyticsCache.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    }

    const rows = await listEstatisticaMensal(filters);
    const payload = {
      success: true,
      source: 'postgresql_analytics',
      count: rows.length,
      rows
    };

    if (CACHE_ENABLED) {
      const affected = getAffectedMonths(filters);
      analyticsCache.set(cacheKey, payload, CACHE_TTL_MS, affected);
    }

    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
