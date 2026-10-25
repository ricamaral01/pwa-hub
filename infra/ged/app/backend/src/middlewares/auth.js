const { verify } = require('../config/jwt');
const { query } = require('../config/database');
const { getUserPermissions } = require('../services/rbacService');

/**
 * Middleware de autenticação JWT.
 * Espera header: Authorization: Bearer <token>
 * Injeta req.user = { id, email, role, name }
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verify(token);
    const result = await query(
      `SELECT id, email, username, role, name, company_id, active, must_change_password, session_version, department_id, managed_area
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário inativo ou inexistente.' });
    }
    if ((decoded.session_version ?? 0) !== user.session_version) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    if (user.must_change_password && decoded.unified !== true &&
        req.path !== '/change-password' && !req.path.endsWith('/change-password')) {
      return res.status(403).json({ error: 'Troca de senha obrigatória.', must_change_password: true });
    }
    req.user = { ...decoded, ...user,
      must_change_password: decoded.unified === true ? false : user.must_change_password,
      permissions: Array.from(await getUserPermissions(user.id)) };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

module.exports = { authenticate };
