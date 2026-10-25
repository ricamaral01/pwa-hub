'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'mapa-concretagem', 'app.js'), 'utf8');
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const quickTimeout = (callback) => setTimeout(callback, 1);

test('foto que o aparelho não consegue decodificar encerra com erro', async () => {
  class BrokenImage {
    set src(value) { queueMicrotask(() => this.onerror()); }
  }
  const context = { Image: BrokenImage, setTimeout, clearTimeout, document: {} };
  vm.runInNewContext(section('function compressImage(', 'async function filesToCompressedDataUrls('), context);
  await assert.rejects(context.compressImage('data:image/heic;base64,AA==', 1024, 0.7),
    /Formato de foto não reconhecido/);
});

test('foto sem resposta do aparelho respeita tempo limite', async () => {
  const context = { Image: class {}, setTimeout: quickTimeout, clearTimeout, document: {} };
  vm.runInNewContext(section('function compressImage(', 'async function filesToCompressedDataUrls('), context);
  await assert.rejects(context.compressImage('data:image/jpeg;base64,AA==', 1024, 0.7),
    /demorou para abrir/);
});

test('salvamento de inspeção não fica preso em uma requisição sem resposta', async () => {
  const context = {
    postToMontagemApi: () => new Promise(() => {}),
    setTimeout: quickTimeout, clearTimeout
  };
  vm.runInNewContext(section('async function postToMontagemApiWithTimeout(', 'function formatDateTime('), context);
  const result = await context.postToMontagemApiWithTimeout('salvar_montagem_poste', {}, 15000);
  assert.equal(result.timeout, true);
  assert.equal(result.ok, false);
});

test('geolocalização sem retorno não bloqueia a finalização', async () => {
  const context = {
    navigator: { geolocation: { getCurrentPosition: () => {} } },
    setTimeout: quickTimeout, clearTimeout
  };
  vm.runInNewContext(section('function getDeviceGeolocation(', 'async function finalizarMontagemPosteAtual('), context);
  const result = await context.getDeviceGeolocation();
  assert.equal(result.error, 'Tempo limite atingido');
});
