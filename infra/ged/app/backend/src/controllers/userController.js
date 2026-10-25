const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { audit } = require('../services/auditService');
const { validatePassword } = require('../services/passwordPolicy');
const { getUserPermissions } = require('../services/rbacService');

const SALT_ROUNDS = 10;
const VALID_ROLES = ['OPERACIONAL', 'COLABORADOR', 'SUPERVISOR', 'QUALIDADE', 'GERENCIA', 'DIRETORIA', 'ADMIN_MASTER', 'ADMIN'];

function publicUser(row) {
  const { password_hash, ...safe } = row;
  return safe;
}

async function list(req, res) {
  const { name, email, role, department_id, active, must_change_password } = req.query;
  const params = [req.user.company_id];
  const conditions = ['u.company_id = $1'];
  let idx = 2;

  if (name) { conditions.push(`u.name ILIKE $${idx++}`); params.push(`%${name}%`); }
  if (email) { conditions.push(`u.email ILIKE $${idx++}`); params.push(`%${email}%`); }
  if (role) { conditions.push(`u.role = $${idx++}`); params.push(role); }
  if (department_id) { conditions.push(`u.department_id = $${idx++}`); params.push(department_id); }
  if (active !== undefined) { conditions.push(`u.active = $${idx++}`); params.push(active === 'true'); }
  if (must_change_password !== undefined) { conditions.push(`u.must_change_password = $${idx++}`); params.push(must_change_password === 'true'); }

  const result = await query(
    `SELECT u.id, u.name, u.username, u.email, u.role, u.managed_area, u.department_id,
            d.name AS department_name, u.job_title, u.active, u.must_change_password,
            u.password_changed_at, u.last_login_at, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.name`,
    params
  );
  res.json(result.rows);
}

async function options(req, res) {
  const [departments, permissions] = await Promise.all([
    query(`SELECT id, code, name FROM departments WHERE company_id = $1 AND active = TRUE ORDER BY name`, [req.user.company_id]),
    query(`SELECT key, description FROM permissions ORDER BY key`),
  ]);
  res.json({ roles: VALID_ROLES, departments: departments.rows, permissions: permissions.rows });
}

async function getById(req, res) {
  const result = await query(
    `SELECT u.id, u.name, u.username, u.email, u.role, u.managed_area, u.department_id,
            d.name AS department_name, u.job_title, u.active, u.must_change_password,
            u.password_changed_at, u.last_login_at, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1 AND u.company_id = $2`,
    [req.params.id, req.user.company_id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
  const permissions = Array.from(await getUserPermissions(req.params.id));
  res.json({ ...result.rows[0], permissions });
}

async function syncPermissions(userId, permissionKeys = [], actorId = null) {
  await query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);
  for (const key of permissionKeys) {
    await query(
      `INSERT INTO user_permissions (user_id, permission_key, effect, granted_by)
       VALUES ($1,$2,'allow',$3)
       ON CONFLICT (user_id, permission_key) DO UPDATE SET effect = 'allow', granted_by = EXCLUDED.granted_by`,
      [userId, key, actorId]
    );
  }
}

async function create(req, res) {
  const {
    name, username, email, password, role, managed_area, department_id, job_title,
    active = true, must_change_password = true, extra_permissions = [],
  } = req.body;

  if (!name || !username || !email || !password || !role) {
    return res.status(400).json({ error: 'Nome, usuário, e-mail, senha temporária e perfil são obrigatórios.' });
  }
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Perfil inválido.' });

  const policy = validatePassword(password, { username, email });
  if (!policy.valid) return res.status(400).json({ error: policy.errors.join(' ') });

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await query(
    `INSERT INTO users
       (name, username, email, password_hash, role, managed_area, department_id, job_title,
        active, must_change_password, company_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id, name, username, email, role, managed_area, department_id, job_title,
               active, must_change_password, created_at`,
    [
      name,
      username.toLowerCase().trim(),
      email.toLowerCase().trim(),
      password_hash,
      role,
      managed_area || null,
      department_id || null,
      job_title || null,
      active,
      must_change_password,
      req.user.company_id,
    ]
  );

  await query(`INSERT INTO password_history (user_id, password_hash) VALUES ($1,$2)`, [result.rows[0].id, password_hash]);
  await syncPermissions(result.rows[0].id, extra_permissions, req.user.id);
  await audit({ req, action: 'users.create', entityType: 'user', entityId: result.rows[0].id, after: result.rows[0] });

  res.status(201).json(result.rows[0]);
}

async function update(req, res) {
  const { id } = req.params;
  const before = await query(`SELECT * FROM users WHERE id = $1 AND company_id = $2`, [id, req.user.company_id]);
  if (!before.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const { name, username, email, role, managed_area, department_id, job_title, active, extra_permissions } = req.body;
  if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Perfil inválido.' });

  const params = [];
  const sets = [];
  let i = 1;
  const add = (field, value) => { sets.push(`${field} = $${i++}`); params.push(value); };

  if (name !== undefined) add('name', name);
  if (username !== undefined) add('username', username ? username.toLowerCase().trim() : null);
  if (email !== undefined) add('email', email.toLowerCase().trim());
  if (role !== undefined) add('role', role);
  if (managed_area !== undefined) add('managed_area', managed_area || null);
  if (department_id !== undefined) add('department_id', department_id || null);
  if (job_title !== undefined) add('job_title', job_title || null);
  if (active !== undefined) add('active', active);

  if (!sets.length && extra_permissions === undefined) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
  }

  let updated = before.rows[0];
  if (sets.length) {
    sets.push('updated_at = NOW()');
    params.push(id, req.user.company_id);
    const result = await query(
      `UPDATE users SET ${sets.join(', ')}
       WHERE id = $${i++} AND company_id = $${i}
       RETURNING id, name, username, email, role, managed_area, department_id, job_title,
                 active, must_change_password, updated_at`,
      params
    );
    updated = result.rows[0];
  }

  if (Array.isArray(extra_permissions)) {
    await syncPermissions(id, extra_permissions, req.user.id);
  }
  await audit({ req, action: 'users.update', entityType: 'user', entityId: id, before: before.rows[0], after: updated });

  res.json(publicUser(updated));
}

async function resetPassword(req, res) {
  const { password } = req.body;
  const { id } = req.params;

  const existing = await query(`SELECT id, username, email, company_id FROM users WHERE id = $1 AND company_id = $2`, [id, req.user.company_id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const policy = validatePassword(password, existing.rows[0]);
  if (!policy.valid) return res.status(400).json({ error: policy.errors.join(' ') });

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  await query(
    `UPDATE users
     SET password_hash = $1,
         must_change_password = TRUE,
         password_changed_at = NULL,
         session_version = session_version + 1,
         updated_at = NOW()
     WHERE id = $2`,
    [password_hash, id]
  );
  await query(`INSERT INTO password_history (user_id, password_hash) VALUES ($1,$2)`, [id, password_hash]);
  await audit({ req, action: 'users.reset_password', entityType: 'user', entityId: id });

  res.json({ message: 'Senha temporária redefinida. O usuário deverá trocá-la no próximo acesso.' });
}

async function remove(req, res) {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Não é possível desativar o próprio usuário.' });

  const before = await query(`SELECT * FROM users WHERE id = $1 AND company_id = $2`, [id, req.user.company_id]);
  if (!before.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

  await query(`UPDATE users SET active = FALSE, session_version = session_version + 1, updated_at = NOW() WHERE id = $1`, [id]);
  await audit({ req, action: 'users.deactivate', entityType: 'user', entityId: id, before: before.rows[0], after: { active: false } });

  res.json({ message: 'Usuário desativado com sucesso.' });
}

module.exports = { list, options, getById, create, update, resetPassword, remove };
