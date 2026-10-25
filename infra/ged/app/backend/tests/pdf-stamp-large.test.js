const assert = require('assert');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { stampInChild } = require('../src/services/pdfStampService');

(async () => {
  const source = fs.readFileSync(process.argv[2]);
  assert.strictEqual(source.length, 50 * 1024 * 1024);
  const started = Date.now();
  const result = await stampInChild(source, 'E2E-A5-LARGE', 0);
  assert.strictEqual(result.warning, null);
  const pdf = await PDFDocument.load(result.buffer);
  assert.strictEqual(pdf.getPageCount(), 1);
  console.log(JSON.stringify({ sourceBytes: source.length, outputBytes: result.buffer.length,
    seconds: Number(((Date.now() - started) / 1000).toFixed(2)), stamped: true }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
