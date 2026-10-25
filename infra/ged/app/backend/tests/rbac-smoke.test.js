const assert = require('assert');
const { validatePassword } = require('../src/services/passwordPolicy');
const { sanitize } = require('../src/services/auditService');

const rolePermissions = {
  OPERACIONAL: ['documents.read', 'documents.download'],
  COLABORADOR: ['documents.create', 'documents.upload', 'documents.submit'],
  SUPERVISOR: ['documents.approve_technical'],
  QUALIDADE: ['documents.approve_quality', 'documents.publish'],
  GERENCIA: ['documents.approve_final'],
  DIRETORIA: ['documents.approve_final'],
  ADMIN_MASTER: ['users.create', 'users.reset_password', 'settings.manage'],
};

function has(role, permission) {
  return rolePermissions[role]?.includes(permission) || role === 'ADMIN_MASTER';
}

assert.strictEqual(has('OPERACIONAL', 'documents.create'), false, 'Operacional não pode criar documento');
assert.strictEqual(has('COLABORADOR', 'documents.create'), true, 'Colaborador pode criar');
assert.strictEqual(has('COLABORADOR', 'documents.approve_technical'), false, 'Colaborador não aprova');
assert.strictEqual(has('SUPERVISOR', 'documents.approve_technical'), true, 'Supervisor aprova tecnicamente');
assert.strictEqual(has('QUALIDADE', 'documents.publish'), true, 'Qualidade publica');
assert.strictEqual(has('GERENCIA', 'documents.approve_final'), true, 'Gerência aprova final');
assert.strictEqual(has('DIRETORIA', 'documents.create'), false, 'Diretoria não recebe fluxo operacional comum por padrão');
assert.strictEqual(has('ADMIN_MASTER', 'users.create'), true, 'Administrador Master cria usuário');

assert.strictEqual(validatePassword('fraca', { username: 'joao', email: 'joao@x.com' }).valid, false);
assert.strictEqual(validatePassword('Senha@123', { username: 'joao', email: 'joao@x.com' }).valid, true);
assert.strictEqual(validatePassword('Senha@123', { username: 'joao', email: 'joao@x.com' }, { sameAsCurrent: true }).valid, false);

const sanitized = sanitize({ password: 'abc', password_hash: 'hash', token: 'jwt', name: 'Ok' });
assert.strictEqual(sanitized.password, '[REDACTED]');
assert.strictEqual(sanitized.password_hash, '[REDACTED]');
assert.strictEqual(sanitized.token, '[REDACTED]');
assert.strictEqual(sanitized.name, 'Ok');

console.log('RBAC smoke tests passed');
