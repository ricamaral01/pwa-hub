const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!SECRET) {
  throw new Error('JWT_SECRET não definido nas variáveis de ambiente.');
}

/**
 * Gera um JWT para o usuário
 * @param {object} payload  Dados a incluir no token (id, email, role)
 */
function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verifica e decodifica um JWT
 * @param {string} token
 */
function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
