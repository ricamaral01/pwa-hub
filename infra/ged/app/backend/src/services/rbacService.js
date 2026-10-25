const { query } = require('../config/database');

const LEGACY_ROLE_MAP = {
  ADMIN: 'ADMIN_MASTER',
  LEITOR: 'OPERACIONAL',
  LABORATORIO: 'COLABORADOR',
  ENGENHARIA: 'SUPERVISOR',
};

function normalizeRole(role) {
  return LEGACY_ROLE_MAP[role] || role;
}

async function getUserPermissions(userId) {
  const result = await query(
    `SELECT permission_key, 'role' AS source, 'allow' AS effect
     FROM role_permissions rp
     JOIN users u ON u.role = rp.role
     WHERE u.id = $1
     UNION ALL
     SELECT permission_key, 'user' AS source, effect
     FROM user_permissions
     WHERE user_id = $1`,
    [userId]
  );

  const permissions = new Set();
  for (const row of result.rows) {
    if (row.effect === 'deny') permissions.delete(row.permission_key);
    else permissions.add(row.permission_key);
  }
  return permissions;
}

async function hasPermission(user, permission) {
  if (!user?.id) return false;
  const permissions = await getUserPermissions(user.id);
  return permissions.has(permission);
}

function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    if (await hasPermission(req.user, permission)) return next();
    return res.status(403).json({ error: `Permissão necessária: ${permission}.` });
  };
}

async function getDepartmentAccess(userId) {
  const result = await query(
    `SELECT department_id FROM user_departments WHERE user_id = $1
     UNION
     SELECT department_id FROM users WHERE id = $1 AND department_id IS NOT NULL`,
    [userId]
  );
  return result.rows.map((row) => row.department_id);
}

async function canAccessDocument(user, doc) {
  if (await hasPermission(user, 'documents.manage')) return true;
  if (!await hasPermission(user, 'documents.read')) return false;
  if (!doc) return false;
  if (doc.status !== 'APROVADO' && doc.status !== 'PUBLICADO' && doc.created_by !== user.id) {
    return false;
  }
  if (doc.visibility === 'PUBLIC_INTERNAL' || doc.visibility === 'INTERNAL') return true;
  const departments = await getDepartmentAccess(user.id);
  if (doc.visibility === 'RESTRICTED_DEPARTMENTS') return departments.includes(doc.department_id);
  if (doc.visibility === 'CONFIDENTIAL') return doc.created_by === user.id;
  return true;
}

module.exports = { normalizeRole, getUserPermissions, hasPermission, requirePermission, getDepartmentAccess, canAccessDocument };
