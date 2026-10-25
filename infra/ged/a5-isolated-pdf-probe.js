const fs = require('fs');
const { addHeader } = require('/app/src/services/pdfService');

(async () => {
  const source = fs.readFileSync('/probe/valid-50.pdf');
  const start = process.hrtime.bigint();
  const output = await addHeader(source, 'E2E-ISOLATED', 0);
  const elapsed = Number(process.hrtime.bigint() - start) / 1e9;
  console.log(JSON.stringify({ sourceBytes: source.length, outputBytes: output.length, seconds: Number(elapsed.toFixed(2)), rssMiB: Number((process.memoryUsage().rss / 1048576).toFixed(1)) }));
})().catch(error => {
  console.error(`isolated parser failed: ${error.name}: ${error.message}`);
  process.exitCode = 1;
});
