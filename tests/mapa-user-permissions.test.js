'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const section = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));

test('diegobat recebe Mandril Circular e Inspecao sem ampliar o perfil Montador', () => {
  const code = section('const ROLE_PERMISSIONS =', 'function getInspecaoChecklistSections')
    + section('function getRoleConfig(role)', 'function readAuthSession()');
  const context = { state: { authUser: { id: 'diegobat', name: 'Diego Carimno' } } };
  vm.runInNewContext(code, context);

  context.setAccessByRole('MONTADOR');
  assert.equal(context.isModeAllowed('MANDRIL_CIRCULAR'), true);
  assert.equal(context.isModeAllowed('INSPECAO'), true);
  assert.equal(context.isModeAllowed('INSPECAO_DETALHE'), true);

  context.state.authUser = { id: 'outro-montador', name: 'Diego Carimno' };
  context.setAccessByRole('MONTADOR');
  assert.equal(context.isModeAllowed('MANDRIL_CIRCULAR'), false);
  assert.equal(context.isModeAllowed('INSPECAO'), true);
});

test('sessao do mapa preserva o login usado nas permissoes individuais', () => {
  const values = new Map();
  const context = {
    localStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    }
  };
  const code = `const AUTH_SESSION_KEY = 'test-session';\n`
    + section('const ROLE_PERMISSIONS =', 'function getInspecaoChecklistSections')
    + section('function getRoleConfig(role)', 'function escapeHtml(str)');
  vm.runInNewContext(code, context);
  context.saveAuthSession({ id: 'diegobat', name: 'Diego Carimno', role: 'MONTADOR', setor: 'Setor 3' });

  const restored = context.readAuthSession();
  assert.equal(restored.id, 'diegobat');
  assert.equal(restored.role, 'MONTADOR');
  assert.equal(restored.setor, 'Setor 3');
});
