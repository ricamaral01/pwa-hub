const express = require('express');
const { randomUUID } = require('crypto');
const { router: controleEstatisticoRouter } = require('./api/controle_estatistico');
const { router: legacyRouter } = require('./api/legacy');
const { readyCheck } = require('./core/database');
const { corsMiddleware, jsonBodyLimit, rateLimit, securityHeaders } = require('./core/security');
const { requestId, requestLogger, log } = require('./core/logger');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = error.status || 500;
  const code = error.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  if (status >= 500) {
    log('ERROR', 'request_failed', {
      request_id: req.requestId,
      error: error.message,
      code,
      status,
    });
  }
  res.status(status).json({
    success: false,
    error: {
      code,
      message: status === 503
        ? 'Fonte de dados temporariamente indisponivel.'
        : (status >= 500 ? 'Erro interno inesperado.' : error.message),
    },
    request_id: req.requestId || randomUUID(),
  });
}

function createApp() {
  const app = express();

  app.set('trust proxy', true);
  app.use(requestId);
  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(corsMiddleware());
  app.use(rateLimit);
  app.use(jsonBodyLimit());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', async (req, res, next) => {
    try {
      await readyCheck();
      res.json({ status: 'ready' });
    } catch (error) {
      next(Object.assign(new Error('Aplicacao indisponivel.'), {
        status: 503,
        code: 'NOT_READY',
      }));
    }
  });

  app.use('/api/controle-estatistico', controleEstatisticoRouter);
  app.use('/api/v1', legacyRouter);

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
