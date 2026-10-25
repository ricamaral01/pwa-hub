const assert = require('node:assert/strict');
const { test } = require('node:test');
const { rncMode, rncWriteGuard } = require('../src/middlewares/rncReadonly');

const WRITES = [
  ['POST', '/'], ['PATCH', '/abc/triage'], ['PATCH', '/abc/status'],
  ['PUT', '/abc/root-cause'], ['POST', '/abc/actions'],
  ['PATCH', '/abc/actions/def'], ['POST', '/abc/effectiveness'],
  ['POST', '/abc/close'], ['POST', '/abc/reopen'],
  ['POST', '/abc/comments'], ['POST', '/abc/attachments'],
];

function call(method, path) {
  let nextCalled = false;
  const response = { statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; } };
  rncWriteGuard({ method, path }, response, () => { nextCalled = true; });
  return { response, nextCalled };
}

test('C2 disabled leaves all RNC writes available', () => {
  process.env.GED_RNC_READONLY = '0';
  for (const [method, path] of WRITES) assert.equal(call(method, path).nextCalled, true);
});

test('C2 enabled returns 410 for every listed write, preserving reads', () => {
  process.env.GED_RNC_READONLY = '1';
  for (const [method, path] of WRITES) {
    const { response, nextCalled } = call(method, path);
    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 410);
    assert.equal(response.body.url, '/unificado/qualidade/abrir');
  }
  for (const path of ['/', '/users/options', '/abc']) assert.equal(call('GET', path).nextCalled, true);
  const res = { body: null, json(value) { this.body = value; } };
  rncMode({}, res);
  assert.deepEqual(res.body, { readonly: true });
  process.env.GED_RNC_READONLY = '0';
});
