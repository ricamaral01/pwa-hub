const { randomUUID } = require('crypto');

function requestId(req, res, next) {
  req.requestId = req.get('x-request-id') || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

function log(level, message, meta) {
  const entry = Object.assign({
    level,
    message,
    time: new Date().toISOString(),
  }, meta || {});
  console.log(JSON.stringify(entry));
}

function requestLogger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    log('INFO', 'request_completed', {
      request_id: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - started,
      source: res.locals.source,
      count: res.locals.count,
    });
  });
  next();
}

module.exports = { log, requestId, requestLogger };
