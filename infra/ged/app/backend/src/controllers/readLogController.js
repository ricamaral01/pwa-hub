const { query } = require('../config/database');

/**
 * POST /api/read-logs
 * Registra confirmação de leitura (ciência) de um documento/versão
 */
async function confirmRead(req, res) {
  const { document_id, version_id } = req.body;

  if (!document_id || !version_id) {
    return res.status(400).json({ error: 'document_id e version_id são obrigatórios.' });
  }

  // Só permite ciência da versão atual e após aprovação final do documento.
  const docCheck = await query(
    `SELECT id, status, current_version_id
     FROM documents
     WHERE id = $1`,
    [document_id]
  );

  if (!docCheck.rows.length) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const doc = docCheck.rows[0];
  if (doc.status !== 'APROVADO') {
    return res.status(409).json({ error: 'A ciência de leitura só é liberada após aprovação final do documento.' });
  }

  if (doc.current_version_id !== version_id) {
    return res.status(409).json({ error: 'A ciência só pode ser confirmada para a versão atual aprovada.' });
  }

  // Verificar se documento/versão existem
  const versionCheck = await query(
    `SELECT id FROM versions WHERE id = $1 AND document_id = $2`,
    [version_id, document_id]
  );

  if (!versionCheck.rows.length) {
    return res.status(404).json({ error: 'Versão não encontrada.' });
  }

  try {
    await query(
      `INSERT INTO read_logs (document_id, version_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (version_id, user_id) DO NOTHING`,
      [document_id, version_id, req.user.id]
    );
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Você já confirmou leitura desta versão.' });
    }
    throw err;
  }

  res.status(201).json({ message: 'Leitura confirmada com sucesso.' });
}

/**
 * GET /api/read-logs/:documentId
 * Lista quem leu cada versão do documento
 */
async function getReadLog(req, res) {
  const { documentId } = req.params;

  const result = await query(
    `SELECT
       rl.id,
       rl.version_id,
       rl.read_at,
       u.id AS user_id,
       u.name AS user_name,
       u.email AS user_email,
       u.role AS user_role,
       v.revision_number,
       v.file_name
     FROM read_logs rl
     JOIN users u    ON u.id = rl.user_id
     JOIN versions v ON v.id = rl.version_id
     WHERE rl.document_id = $1
     ORDER BY v.revision_number DESC, rl.read_at DESC`,
    [documentId]
  );

  res.json(result.rows);
}

/**
 * GET /api/read-logs/:documentId/my-status
 * Verifica se o usuário logado leu a versão atual
 */
async function myReadStatus(req, res) {
  const { documentId } = req.params;

  const docResult = await query(
    `SELECT current_version_id, status FROM documents WHERE id = $1`,
    [documentId]
  );

  if (!docResult.rows.length) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const currentVersionId = docResult.rows[0].current_version_id;
  const docStatus = docResult.rows[0].status;

  if (docStatus !== 'APROVADO') {
    return res.json({ read: false, read_at: null, current_version_id: null });
  }

  if (!currentVersionId) {
    return res.json({ read: false, current_version_id: null });
  }

  const readResult = await query(
    `SELECT id, read_at FROM read_logs
     WHERE version_id = $1 AND user_id = $2`,
    [currentVersionId, req.user.id]
  );

  res.json({
    read: readResult.rows.length > 0,
    read_at: readResult.rows[0]?.read_at || null,
    current_version_id: currentVersionId,
  });
}

module.exports = { confirmRead, getReadLog, myReadStatus };
