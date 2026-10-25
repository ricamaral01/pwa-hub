const { query } = require('../config/database');
const emailService = require('./emailService');

async function checkExpiringDocuments() {
  console.log('[alertService] Verificando documentos expirando...');
  const result = await query(`
    SELECT 
      d.id, d.code, d.name, d.valid_until, d.area,
      (d.valid_until - CURRENT_DATE) as days_remaining,
      u.email as creator_email
    FROM documents d
    LEFT JOIN users u ON u.id = d.created_by
    WHERE d.valid_until IS NOT NULL
      AND d.status = 'APROVADO'
      AND d.valid_until <= CURRENT_DATE + INTERVAL '30 days'
      AND d.valid_until >= CURRENT_DATE
  `);

  for (const doc of result.rows) {
    const { code, name, valid_until, days_remaining, creator_email, area } = doc;
    const managers = await query(
      "SELECT email FROM users WHERE active = TRUE AND managed_area IN ($1, 'SGQ')",
      [area]
    );
    
    const recipients = new Set();
    if (creator_email) recipients.add(creator_email);
    managers.rows.forEach(m => recipients.add(m.email));

    for (const email of recipients) {
      try {
        await emailService.sendExpirationAlert(
          email,
          name,
          code,
          valid_until.toISOString().split('T')[0],
          days_remaining
        );
      } catch (err) {
        console.error(`[alertService] Erro ao enviar alerta para ${email}:`, err.message);
      }
    }
  }
}

module.exports = { checkExpiringDocuments };
