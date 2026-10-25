const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Insere um cabeçalho automático em todas as páginas de um PDF.
 *
 * O cabeçalho contém:
 * - Código do documento
 * - Revisão (ex: Rev 02)
 * - Data de geração
 *
 * @param {Buffer} pdfBuffer  Buffer do PDF original
 * @param {string} code       Código do documento
 * @param {number} revision   Número da revisão (ex: 2 → "Rev 02")
 * @param {Date}   date       Data de geração
 * @returns {Buffer}          Buffer do PDF com cabeçalho inserido
 */
async function addHeader(pdfBuffer, code, revision, date = new Date()) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const revText  = `Rev ${String(revision).padStart(2, '0')}`;
  const dateText = date.toLocaleDateString('pt-BR');
  const headerHeight = 32;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    // Fundo do cabeçalho (retângulo cinza claro)
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width,
      height: headerHeight,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Borda inferior do cabeçalho
    page.drawLine({
      start: { x: 0,     y: height - headerHeight },
      end:   { x: width, y: height - headerHeight },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Logo/empresa (esquerda)
    page.drawText('CONCREFER', {
      x: 10,
      y: height - 22,
      size: 11,
      font,
      color: rgb(0.1, 0.3, 0.6),
    });

    // Código do documento (centro)
    const codeWidth = fontRegular.widthOfTextAtSize(code, 9);
    page.drawText(code, {
      x: (width - codeWidth) / 2,
      y: height - 22,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Revisão + Data (direita)
    const infoText = `${revText}  |  ${dateText}`;
    const infoWidth = fontRegular.widthOfTextAtSize(infoText, 9);
    page.drawText(infoText, {
      x: width - infoWidth - 10,
      y: height - 22,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { addHeader };
