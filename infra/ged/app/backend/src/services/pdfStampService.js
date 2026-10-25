const path = require('path');
const { spawn } = require('child_process');

const MAX_OUTPUT_BYTES = 60 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

function stampInChild(fileBuffer, code, revision, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const worker = options.workerPath || path.join(__dirname, 'pdfStampWorker.js');
  return new Promise((resolve) => {
    let done = false;
    let timedOut = false;
    let outputBytes = 0;
    const output = [];
  const child = spawn(process.execPath, ['--max-old-space-size=384', worker, code, String(revision)], {
      stdio: ['pipe', 'pipe', 'pipe'],
    env: { NODE_ENV: process.env.NODE_ENV || 'production' },
    });
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL');
      } else {
        output.push(chunk);
      }
    });
    child.stderr.on('data', () => {});
    child.stdin.on('error', () => {});
    child.on('error', () => finish({ buffer: fileBuffer, warning: 'Carimbo não aplicado: falha ao iniciar processamento isolado.', reason: 'WORKER_ERROR' }));
    child.on('close', (code) => {
      if (timedOut) return finish({ buffer: fileBuffer, warning: 'Carimbo não aplicado: processamento excedeu 30 segundos.', reason: 'TIMEOUT' });
      if (outputBytes > MAX_OUTPUT_BYTES) return finish({ buffer: fileBuffer, warning: 'Carimbo não aplicado: saída excedeu o limite seguro.', reason: 'OUTPUT_LIMIT' });
      if (code !== 0) return finish({ buffer: fileBuffer, warning: 'Carimbo não aplicado: PDF inválido ou erro no processamento.', reason: 'STAMP_ERROR' });
      if (outputBytes === 0) return finish({ buffer: fileBuffer, warning: 'Carimbo não aplicado: processamento sem saída.', reason: 'EMPTY_OUTPUT' });
      finish({ buffer: Buffer.concat(output), warning: null, reason: null });
    });
    child.stdin.end(fileBuffer);
  });
}

module.exports = { stampInChild };
