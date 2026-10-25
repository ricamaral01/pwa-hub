const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const { canAccessDocument } = require('../services/rbacService');

const uploadRoot = path.resolve(__dirname, '../../uploads');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const officeFile = /\.(?:doc|docx|xls|xlsx)$/i;
const allowedFolder = /^(?:vigentes|em_revisao|obsoletos|modelos)\//;
const lifetimeSeconds = 300;

function safeRelative(value) {
  return typeof value === 'string' && allowedFolder.test(value) &&
    !value.includes('\\') && value.split('/').every((part) => part && part !== '.' && part !== '..');
}

function signature(documentId, versionId, relative, expires) {
  if (!process.env.JWT_SECRET) throw new Error('Preview signing unavailable');
  return crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(`ged-office-preview-v1\n${documentId}\n${versionId}\n${relative}\n${expires}`)
    .digest('hex');
}

function logResult(documentId, versionId, result) {
  // Never log the signed URL, request target, token, or session.
  console.info(`GED_PREVIEW document=${documentId || '-'} version=${versionId || '-'} result=${result}`);
}

async function issuePreviewLink(req, res) {
  const { id, versionId } = req.params;
  if (!uuid.test(id) || !uuid.test(versionId)) return res.status(400).end();
  const { rows } = await query(
    `SELECT d.*, v.id AS preview_version_id, v.drive_file_id AS preview_file_id,
            v.file_name AS preview_file_name
       FROM versions v JOIN documents d ON d.id=v.document_id
      WHERE d.id=$1 AND v.id=$2 AND d.company_id=$3 LIMIT 1`,
    [id, versionId, req.user.company_id]
  );
  const document = rows[0];
  if (!document) { logResult(id, versionId, 404); return res.status(404).end(); }
  if (!await canAccessDocument(req.user, document)) {
    logResult(id, versionId, 403);
    return res.status(403).end();
  }
  const relative = document.preview_file_id;
  if (!safeRelative(relative) || !officeFile.test(document.preview_file_name || '')) {
    logResult(id, versionId, 415);
    return res.status(415).end();
  }
  const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  const mac = signature(id, versionId, relative, expires);
  const origin = (process.env.CORS_ORIGIN || 'https://concrefer.concretrack.com.br').replace(/\/$/, '');
  const url = `${origin}/unificado/ged/previews/${versionId}/${expires}/${mac}`;
  res.set('Cache-Control', 'no-store');
  logResult(id, versionId, 200);
  return res.json({ url, expires_at: new Date(expires * 1000).toISOString() });
}

async function servePreview(req, res) {
  const { versionId, expires, mac } = req.params;
  if (!uuid.test(versionId)) {
    logResult(null, null, '403-version');
    return res.status(403).end();
  }
  if (!/^\d{10}$/.test(expires)) {
    logResult(null, versionId, '403-expiry-format');
    return res.status(403).end();
  }
  if (!/^[0-9a-f]{64}$/i.test(mac)) {
    logResult(null, versionId, '403-signature-format');
    return res.status(403).end();
  }
  const now = Math.floor(Date.now() / 1000);
  const expiresNumber = Number(expires);
  if (expiresNumber <= now || expiresNumber > now + lifetimeSeconds) {
    logResult(null, versionId, '403-expired');
    return res.status(403).end();
  }
  const { rows } = await query(
    `SELECT v.id, v.document_id, v.drive_file_id, v.file_name
       FROM versions v WHERE v.id=$1 LIMIT 1`, [versionId]
  );
  const version = rows[0];
  const relative = version?.drive_file_id;
  if (!version || !safeRelative(relative) || !officeFile.test(version.file_name || '')) {
    logResult(version?.document_id, versionId, 404);
    return res.status(404).end();
  }
  const expected = Buffer.from(signature(version.document_id, versionId, relative, expires), 'hex');
  const received = Buffer.from(mac, 'hex');
  if (!crypto.timingSafeEqual(expected, received)) {
    logResult(version.document_id, versionId, 403);
    return res.status(403).end();
  }
  const target = path.resolve(uploadRoot, relative);
  let realPath;
  try { realPath = fs.realpathSync(target); }
  catch { logResult(version.document_id, versionId, 404); return res.status(404).end(); }
  if (!realPath.startsWith(`${uploadRoot}${path.sep}`)) {
    logResult(version.document_id, versionId, 404);
    return res.status(404).end();
  }
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Disposition', 'inline');
  logResult(version.document_id, versionId, 200);
  return res.sendFile(realPath);
}

module.exports = { issuePreviewLink, servePreview, signature, safeRelative };
