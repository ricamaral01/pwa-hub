require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const approvalRoutes = require('./src/routes/approvalRoutes');
const readLogRoutes = require('./src/routes/readLogRoutes');

const app = express();

// ── Middlewares globais ──────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Pasta de uploads — servida publicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// ── Rotas ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/read-logs', readLogRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Error handler global ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message, err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'UnauthorizedError' || err.message === 'UNAUTHORIZED') {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  if (err.message === 'FORBIDDEN') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado: ' + err.detail });
  }

  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GED Backend rodando na porta ${PORT}`);
});

module.exports = app;
