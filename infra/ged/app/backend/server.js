require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const { checkExpiringDocuments } = require('./src/services/alertService');
const { serveUpload } = require('./src/controllers/uploadController');
const { servePreview } = require('./src/controllers/previewController');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const approvalRoutes = require('./src/routes/approvalRoutes');
const readLogRoutes = require('./src/routes/readLogRoutes');
const rncRoutes = require('./src/routes/rncRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const calibrationRoutes = require('./src/routes/calibrationRoutes');
const unifiedRoutes = require('./src/routes/unifiedRoutes');

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN || 'https://concrefer.concretrack.com.br';
app.use(cors({
  origin: (origin, callback) => callback(null, origin === allowedOrigin),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/uploads/*', serveUpload);
app.get('/previews/:versionId/:expires/:mac', servePreview);

app.use('/api/auth', authRoutes);
app.use('/api/unified', unifiedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/read-logs', readLogRoutes);
app.use('/api/rnc', rncRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calibrations', calibrationRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message, err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === '23505') {
    if (err.constraint === 'documents_code_key') {
      return res.status(409).json({ error: 'Já existe um documento com este código.' });
    }
    return res.status(409).json({ error: 'Registro duplicado.' });
  }
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GED Backend rodando na porta ${PORT}`);
  if (process.env.GED_DISABLE_EMAIL_ALERTS !== '1') {
    setInterval(() => checkExpiringDocuments().catch(console.error), 1000 * 60 * 60 * 24);
    checkExpiringDocuments().catch(console.error);
  }
});

module.exports = app;
