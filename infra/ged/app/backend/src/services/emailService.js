const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendApprovalRequest(to, docName, docCode, revision, approvalUrl) {
  const html = `<h2>Aprovação Pendente: ${docCode}</h2><p>${docName} - ${revision}</p><a href="${approvalUrl}">Ver no GED</a>`;
  await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject: `[GED] Aprovação: ${docCode}`, html });
}

async function sendDocumentUpdated(toList, docName, docCode, revision, docUrl) {
  const html = `<h2>Atualizado: ${docCode}</h2><p>${docName} - ${revision}</p><a href="${docUrl}">Ver</a>`;
  await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to: toList.join(','), subject: `[GED] Atualizado: ${docCode}`, html });
}

async function sendExpirationAlert(to, docName, docCode, validUntil, daysRemaining) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #c0392b;">
      <h2 style="color: #c0392b;">⚠️ Alerta de Vencimento de Documento</h2>
      <p>O documento <strong>${docCode} - ${docName}</strong> vencerá em <strong>${daysRemaining} dias</strong> (${validUntil}).</p>
      <p>Por favor, providencie a revisão ou renovação.</p>
    </div>
  `;
  await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject: `[ALERTA VENCIMENTO] ${docCode}`, html });
}

module.exports = { sendApprovalRequest, sendDocumentUpdated, sendExpirationAlert };
