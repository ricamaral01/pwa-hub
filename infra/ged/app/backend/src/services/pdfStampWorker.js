const { addHeader } = require('./pdfService');

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', async () => {
  try {
    const [code, revision] = process.argv.slice(2);
    const output = await addHeader(Buffer.concat(chunks), code, Number(revision));
    process.stdout.write(output);
  } catch (error) {
    process.stderr.write(`PDF_STAMP_ERROR:${error?.name || 'Error'}\n`);
    process.exitCode = 1;
  }
});
