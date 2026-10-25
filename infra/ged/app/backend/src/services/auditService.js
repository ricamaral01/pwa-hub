const { query } = require('../config/database');

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  const clone = Array.isArray(data) ? [...data] : { ...data };
  for (const key of Object.keys(clone)) {
    if (/password|token|secret|hash/i.test(key)) {
      clone[key] = '[REDACTED]';
    } else if (clone[key] && typeof clone[key] === 'object') {
      clone[key] = sanitize(clone[key]);
    }
  }
  return clone;
}

async function audit({ req, userId, companyId, action, entityType, entityId, before, after, comment }) {
  await query(
    `INSERT INTO audit_logs
       (company_id, actor_user_id, action, entity_type, entity_id, ip_address, before_data, after_data, comment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      companyId || req?.user?.company_id || null,
      userId || req?.user?.id || null,
      action,
      entityType,
      entityId || null,
      req?.ip || null,
      before ? JSON.stringify(sanitize(before)) : null,
      after ? JSON.stringify(sanitize(after)) : null,
      comment || null,
    ]
  );
}

module.exports = { audit, sanitize };
