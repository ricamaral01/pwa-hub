const assert = require('assert');
const http = require('http');
const { PDFDocument } = require('pdf-lib');
const { stampInChild } = require('../src/services/pdfStampService');

async function main() {
  const pdf = await PDFDocument.create();
  pdf.addPage([612, 792]);
  const valid = Buffer.from(await pdf.save());
  const stamped = await stampInChild(valid, 'E2E-STAMP', 2, { timeoutMs: 5000 });
  assert.strictEqual(stamped.warning, null);
  assert(stamped.buffer.length > valid.length);
  await PDFDocument.load(stamped.buffer);

  const server = http.createServer((_req, res) => res.end('healthy'));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const malformed = Buffer.alloc(50 * 1024 * 1024, 'x');
    malformed.write('%PDF-1.4\n');
    const work = stampInChild(malformed, 'E2E-BAD', 0, { timeoutMs: 500 });
    const started = Date.now();
    const health = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${server.address().port}/health`, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body }));
      }).on('error', reject);
    });
    assert.deepStrictEqual(health, { status: 200, body: 'healthy' });
    assert(Date.now() - started < 1000, 'API event loop blocked by malformed PDF');
    const fallback = await work;
    assert(fallback.warning);
    assert.strictEqual(fallback.buffer, malformed);
    assert(['TIMEOUT', 'STAMP_ERROR'].includes(fallback.reason));
    console.log(JSON.stringify({ valid: 'stamped', malformed: fallback.reason, apiResponsive: true }));
  } finally {
    server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
