const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { sign } = require('../config/jwt');
const { audit } = require('../services/auditService');
const { validatePassword } = require('../services/passwordPolicy');
const { getUserPermissions } = require('../services/rbacService');
const downloadCookie = process.env.GED_DOWNLOAD_COOKIE || 'ged_download_session';

async function login(req, res) {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').toLowerCase().trim();
  if (!identifier || !password) return res.status(400).json({ error: 'Usuário/e-mail e senha são obrigatórios.' });

  const result = await query(
    `SELECT u.id, u.name, u.email, u.username, u.password_hash, u.role, u.managed_area, u.department_id,
            u.active, u.company_id, u.must_change_password, u.session_version,
            c.slug AS company_slug, c.primary_color
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE LOWER(u.email) = $1 OR LOWER(u.username) = $1`,
    [identifier]
  );

  const user = result.rows[0];
  if (!user || !user.active) {
    await query(
      `INSERT INTO login_attempts (company_id, user_id, login_identifier, success, ip_address, reason)
       VALUES ($1,$2,$3,FALSE,$4,$5)`,
      [user?.company_id || null, user?.id || null, identifier, req.ip || null, 'invalid_or_inactive']
    );
    return res.status(401).json({ error: 'Credenciais inválidas ou conta inativa.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await query(
      `INSERT INTO login_attempts (company_id, user_id, login_identifier, success, ip_address, reason)
       VALUES ($1,$2,$3,FALSE,$4,$5)`,
      [user.company_id, user.id, identifier, req.ip || null, 'invalid_password']
    );
    await audit({ req, userId: user.id, companyId: user.company_id, action: 'auth.login_failed', entityType: 'user', entityId: user.id, comment: 'Senha inválida.' });
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  await query(
    `UPDATE users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2`,
    [req.ip || null, user.id]
  );
  await query(
    `INSERT INTO login_attempts (company_id, user_id, login_identifier, success, ip_address)
     VALUES ($1,$2,$3,TRUE,$4)`,
    [user.company_id, user.id, identifier, req.ip || null]
  );
  await audit({ req, userId: user.id, companyId: user.company_id, action: 'auth.login_success', entityType: 'user', entityId: user.id });

  const token = sign({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    name: user.name,
    company_id: user.company_id,
    company_slug: user.company_slug,
    session_version: user.session_version,
    must_change_password: user.must_change_password
  });

  const permissions = Array.from(await getUserPermissions(user.id));
  res.cookie(downloadCookie, token, {
    httpOnly: true, secure: true, sameSite: 'lax',
    path: '/unificado/ged/uploads/', maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({
    token,
    must_change_password: user.must_change_password,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      managed_area: user.managed_area,
      department_id: user.department_id,
      company_id: user.company_id,
      company_slug: user.company_slug,
      primary_color: user.primary_color,
      must_change_password: user.must_change_password,
      permissions
    }
  });
}

async function getMe(req, res) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (token) res.cookie(downloadCookie, token, {
    httpOnly: true, secure: true, sameSite: 'lax',
    path: '/unificado/ged/uploads/', maxAge: 8 * 60 * 60 * 1000,
  });
  const result = await query(
    `SELECT id, name, email, username, role, managed_area, department_id, active, company_id,
            must_change_password, password_changed_at, last_login_at
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ ...result.rows[0],
    must_change_password: req.user.must_change_password,
    permissions: req.user.permissions || [] });
}

function logout(_req, res) {
  res.clearCookie(downloadCookie, { httpOnly: true, secure: true, sameSite: 'lax', path: '/unificado/ged/uploads/' });
  res.status(204).end();
}

async function changePassword(req, res) {
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'Senha atual, nova senha e confirmação são obrigatórias.' });
  }
  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'A confirmação da senha não confere.' });
  }

  const result = await query(
    `SELECT id, name, email, username, password_hash, company_id FROM users WHERE id = $1`,
    [req.user.id]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const currentOk = await bcrypt.compare(current_password, user.password_hash);
  if (!currentOk) return res.status(401).json({ error: 'Senha atual inválida.' });

  const sameAsCurrent = await bcrypt.compare(new_password, user.password_hash);
  const policy = validatePassword(new_password, user, { sameAsCurrent });
  if (!policy.valid) return res.status(400).json({ error: policy.errors.join(' ') });

  const password_hash = await bcrypt.hash(new_password, 10);
  await query(
    `UPDATE users
     SET password_hash = $1,
         must_change_password = FALSE,
         password_changed_at = NOW(),
         session_version = session_version + 1,
         updated_at = NOW()
     WHERE id = $2`,
    [password_hash, user.id]
  );
  await query(`INSERT INTO password_history (user_id, password_hash) VALUES ($1,$2)`, [user.id, password_hash]);
  await audit({ req, action: 'auth.password_changed', entityType: 'user', entityId: user.id });

  res.json({ message: 'Senha alterada com sucesso. Faça login novamente.' });
}

module.exports = { login, getMe, changePassword, logout };
