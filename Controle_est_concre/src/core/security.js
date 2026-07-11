const express = require('express');
const cors = require('cors');
const { config } = require('./config');

const buckets = new Map();

function securityHeaders(req, res, next) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'same-origin');
  res.setHeader('x-frame-options', 'SAMEORIGIN');
  next();
}

function corsMiddleware() {
  if (!config.security.allowedOrigins.length) {
    return (req, res, next) => next();
  }
  return cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.security.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed'));
    },
  });
}

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = buckets.get(key);
  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.security.rateLimitWindowMs });
    next();
    return;
  }
  current.count += 1;
  if (current.count > config.security.rateLimitMax) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas requisicoes em curto periodo.',
      },
      request_id: req.requestId,
    });
    return;
  }
  next();
}

function jsonBodyLimit() {
  return express.json({ limit: '1mb' });
}

module.exports = { corsMiddleware, jsonBodyLimit, rateLimit, securityHeaders };
