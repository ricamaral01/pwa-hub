const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const { authenticate } = require('../middlewares/auth');
const { hasPermission, canAccessDocument } = require('../services/rbacService');
const downloadCookie = process.env.GED_DOWNLOAD_COOKIE || 'ged_download_session';

const uploadRoot = path.resolve(__dirname, '../../uploads');
const allowedFolders = new Set(['vigentes', 'em_revisao', 'obsoletos', 'modelos', 'tasks', 'rnc', 'calibrations']);

function sessionCookie(req) {
  const match = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(downloadCookie + '='));
  return match ? decodeURIComponent(match.slice(downloadCookie.length + 1)) : null;
}

async function downloadUser(req, res) {
  const token = sessionCookie(req);
  if (!token) {
    res.status(401).json({ error: 'Autenticação necessária para baixar o arquivo.' });
    return false;
  }
  req.headers.authorization = `Bearer ${token}`;
  await authenticate(req, res, () => {});
  return !!req.user;
}

async function authorized(req, relative) {
  const user = req.user;
  const filePath = `/uploads/${relative}`;
  const prefixedPath = `/unificado/ged${filePath}`;
  const parts = relative.split('/');
  if (['vigentes', 'em_revisao', 'obsoletos', 'modelos'].includes(parts[0])) {
    if (!await hasPermission(user, 'documents.download')) return false;
    const { rows } = await query(
      `SELECT d.* FROM versions v JOIN documents d ON d.id = v.document_id
       WHERE v.drive_file_id = $1 AND d.company_id = $2 LIMIT 1`,
      [relative, user.company_id]
    );
    return rows.length > 0 && await canAccessDocument(user, rows[0]);
  }
  if (parts[0] === 'tasks') {
    const { rows } = await query(
      `SELECT t.*, EXISTS (SELECT 1 FROM task_participants tp WHERE tp.task_id=t.id AND tp.user_id=$2) is_participant
       FROM task_attachments a JOIN tasks t ON t.id=a.task_id
       WHERE a.storage_path IN ($1,$3) AND t.company_id=$4 LIMIT 1`,
      [filePath, user.id, prefixedPath, user.company_id]
    );
    const task = rows[0];
    return !!task && (['ADMIN', 'ADMIN_MASTER', 'QUALIDADE'].includes(user.role) || task.created_by === user.id || task.responsible_id === user.id || task.is_participant || (!!user.managed_area && user.managed_area === task.department));
  }
  if (parts[0] === 'rnc') {
    const { rows } = await query(
      `SELECT r.* FROM rnc_attachments a JOIN rnc_reports r ON r.id=a.rnc_id
       WHERE a.storage_path IN ($1,$2) AND r.company_id=$3 LIMIT 1`,
      [filePath, prefixedPath, user.company_id]
    );
    const rnc = rows[0];
    return !!rnc && (['ADMIN', 'ADMIN_MASTER', 'QUALIDADE'].includes(user.role) || (['ENGENHARIA', 'LABORATORIO'].includes(user.role) && (rnc.created_by === user.id || rnc.responsible_sector_user_id === user.id || (!!user.managed_area && user.managed_area === rnc.destination_area))));
  }
  return false;
}

async function publicCalibration(relative) {
  if (!/^calibrations\/(?:qr\/)?[a-zA-Z0-9._-]+$/.test(relative)) return false;
  const filePath = `/uploads/${relative}`;
  const prefixedPath = `/unificado/ged${filePath}`;
  const { rows } = await query(
    `SELECT id FROM calibration_certificates
     WHERE file_url IN ($1,$2) OR qr_code_url IN ($1,$2) LIMIT 1`,
    [filePath, prefixedPath]
  );
  return rows.length > 0;
}

async function serveUpload(req, res) {
  let relative;
  try { relative = decodeURIComponent(req.params[0]); }
  catch { return res.status(400).end(); }
  const parts = relative.split('/');
  if (!allowedFolders.has(parts[0]) || parts.some(p => !p || p === '.' || p === '..') || relative.includes('\\')) return res.status(404).end();
  const target = path.resolve(uploadRoot, relative);
  if (!target.startsWith(`${uploadRoot}${path.sep}`)) return res.status(404).end();

  const isPublic = await publicCalibration(relative);
  if (!isPublic) {
    if (parts[0] === 'calibrations') return res.status(404).end();
    if (!await downloadUser(req, res)) return;
    if (!await authorized(req, relative)) return res.status(403).json({ error: 'Sem permissão para este arquivo.' });
  }
  let realPath;
  try { realPath = fs.realpathSync(target); }
  catch { return res.status(404).end(); }
  if (!realPath.startsWith(`${uploadRoot}${path.sep}`)) return res.status(404).end();
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'private, no-store');
  return res.sendFile(realPath);
}

module.exports = { serveUpload };
