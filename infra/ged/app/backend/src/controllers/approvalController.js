const { query } = require('../config/database');
const storageService = require('../services/storageService');
const { hasPermission } = require('../services/rbacService');
const { audit } = require('../services/auditService');

async function getPending(req, res) {
  const isAdmin = req.user.role === 'ADMIN';
  const isMaster = req.user.role === 'ADMIN_MASTER' || isAdmin;
  const params = isMaster ? [req.user.company_id] : [req.user.id, req.user.company_id];
  const result = await query(
    `SELECT
       a.id AS approval_id,
       a.*,
       v.revision_number,
       v.file_name,
       v.drive_web_url,
       d.code,
       d.name,
       d.area,
       u.name AS requested_by_name,
       u.email AS requested_by_email,
       ru.name AS required_approver_name
     FROM approvals a
     JOIN versions  v ON v.id = a.version_id
     JOIN documents d ON d.id = a.document_id
     JOIN users     u ON u.id = a.requested_by
     JOIN users    ru ON ru.id = a.required_approver_id
     WHERE a.status = 'PENDENTE'
       ${isMaster ? 'AND a.company_id = $1' : 'AND a.required_approver_id = $1 AND a.company_id = $2'}
       AND NOT EXISTS (
         SELECT 1
         FROM approvals previous
         WHERE previous.version_id = a.version_id
           AND previous.approval_level < a.approval_level
           AND previous.status <> 'APROVADO'
       )
     ORDER BY a.requested_at DESC`,
    params
  );
  res.json(result.rows);
}

async function getAll(req, res) {
  const result = await query(
    `SELECT
       a.*,
       v.revision_number,
       v.file_name,
       d.code,
       d.name AS document_name,
       u.name AS requested_by_name,
       au.name AS approved_by_name,
       ru.name AS required_approver_name
     FROM approvals a
     JOIN versions  v  ON v.id = a.version_id
     JOIN documents d  ON d.id = a.document_id
     JOIN users     u  ON u.id = a.requested_by
     LEFT JOIN users au ON au.id = a.approved_by
     LEFT JOIN users ru ON ru.id = a.required_approver_id
     WHERE a.company_id = $1
     ORDER BY a.requested_at DESC
     LIMIT 100`,
    [req.user.company_id]
  );
  res.json(result.rows);
}

async function approve(req, res) {
  const { versionId } = req.params;
  const { comments } = req.body;
  const isAdmin = req.user.role === 'ADMIN';
  const isMaster = req.user.role === 'ADMIN_MASTER' || isAdmin;

  const approvalResult = await query(
    `SELECT a.*, v.drive_file_id, v.drive_folder, v.revision_number,
            v.document_id, d.code, d.name AS doc_name, v.drive_web_url
     FROM approvals a
     JOIN versions v  ON v.id = a.version_id
     JOIN documents d ON d.id = a.document_id
     WHERE a.version_id = $1
       ${isMaster ? '' : 'AND a.required_approver_id = $2'}
       AND a.company_id = $${isMaster ? 2 : 3}
       AND a.status = 'PENDENTE'
     ORDER BY a.approval_level ASC
     LIMIT 1`,
    isMaster ? [versionId, req.user.company_id] : [versionId, req.user.id, req.user.company_id]
  );

  if (!approvalResult.rows.length) {
    return res.status(404).json({ error: isAdmin ? 'Nenhuma aprovação pendente encontrada para esta versão.' : 'Nenhuma aprovação pendente atribuída a você.' });
  }

  const approval = approvalResult.rows[0];

  if (approval.requested_by === req.user.id && !isMaster) {
    return res.status(403).json({ error: 'Quem submete o documento não pode aprovar o próprio documento.' });
  }

  const requiredPermission = approval.approval_level === 1
    ? 'documents.approve_technical'
    : approval.approval_level === 2
      ? 'documents.approve_quality'
      : 'documents.approve_final';
  if (!isMaster && !await hasPermission(req.user, requiredPermission)) {
    return res.status(403).json({ error: `Permissão necessária: ${requiredPermission}.` });
  }

  if (!isMaster) {
    const previousPending = await query(
      `SELECT 1
       FROM approvals
       WHERE version_id = $1
         AND approval_level < $2
         AND status <> 'APROVADO'
       LIMIT 1`,
      [versionId, approval.approval_level]
    );

    if (previousPending.rows.length) {
      return res.status(409).json({ error: 'Aguarde a aprovação do nível anterior.' });
    }
  }

  await query(
    `UPDATE approvals
     SET status = 'APROVADO', approved_by = $1, resolved_at = NOW(), comments = $2
     WHERE id = $3`,
    [req.user.id, comments || null, approval.id]
  );
  await audit({ req, action: 'documents.approve', entityType: 'version', entityId: versionId, comment: comments || null });

  const countResult = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'APROVADO')::int AS approved
     FROM approvals
     WHERE version_id = $1`,
    [versionId]
  );

  if (countResult.rows[0].approved < countResult.rows[0].total) {
     // Notificar próximo aprovador
     return res.json({ message: 'Aprovação registrada. Aguardando próximos níveis.' });
  }

  // Finalizar Aprovação
  if (approval.drive_file_id && approval.drive_folder === 'EM_REVISAO') {
    const moved = await storageService.moveFile(approval.drive_file_id, 'EM_REVISAO', 'VIGENTES').catch((err) => {
      console.error(err);
      return null;
    });
    await query(
      `UPDATE versions
       SET drive_folder = 'VIGENTES',
           drive_file_id = COALESCE($2, drive_file_id),
           drive_web_url = COALESCE($3, drive_web_url)
       WHERE id = $1`,
      [versionId, moved?.id || null, moved?.webViewLink || null]
    );
  }

  await query(
    `UPDATE documents SET status = 'APROVADO', updated_at = NOW() WHERE id = $1`,
    [approval.document_id]
  );
  await audit({ req, action: 'documents.publish', entityType: 'document', entityId: approval.document_id });
  await query(
    `UPDATE versions
     SET drive_folder = 'OBSOLETOS'
     WHERE document_id = $1 AND id <> $2 AND drive_folder = 'VIGENTES'`,
    [approval.document_id, versionId]
  );

  res.json({ message: 'Documento aprovado com sucesso!' });
}

async function reject(req, res) {
  const { versionId } = req.params;
  const { comments } = req.body;
  const isAdmin = req.user.role === 'ADMIN';
  const isMaster = req.user.role === 'ADMIN_MASTER' || isAdmin;

  if (!comments) return res.status(400).json({ error: 'Motivo da rejeição obrigatório.' });

  const result = await query(
    `WITH selected AS (
       SELECT a.id, a.document_id
       FROM approvals a
       WHERE a.version_id = $1
         ${isMaster ? '' : 'AND a.required_approver_id = $2'}
         AND a.company_id = $${isMaster ? 2 : 3}
         AND a.status = 'PENDENTE'
         AND NOT EXISTS (
           SELECT 1
           FROM approvals previous
           WHERE previous.version_id = a.version_id
             AND previous.approval_level < a.approval_level
             AND previous.status <> 'APROVADO'
         )
       ORDER BY a.approval_level ASC
       LIMIT 1
     ), rejected AS (
       UPDATE approvals a
       SET status = 'REJEITADO', approved_by = $${isMaster ? 3 : 4}, resolved_at = NOW(), comments = $${isMaster ? 4 : 5}
       FROM selected s
       WHERE a.id = s.id
       RETURNING a.document_id, a.version_id
     ), cancelled AS (
       UPDATE approvals a
       SET status = 'REJEITADO', resolved_at = NOW(),
           comments = COALESCE(a.comments, 'Fluxo encerrado pela rejeicao de uma etapa anterior.')
       FROM rejected r
       WHERE a.version_id = r.version_id
         AND a.status = 'PENDENTE'
       RETURNING a.id
     )
     SELECT document_id FROM rejected`,
    isMaster
      ? [versionId, req.user.company_id, req.user.id, comments]
      : [versionId, req.user.id, req.user.company_id, req.user.id, comments]
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: 'Nenhuma aprovação pendente atribuída a você.' });
  }

  await query(
    `UPDATE documents SET status = 'EM_REVISAO', updated_at = NOW() WHERE id = $1`,
    [result.rows[0].document_id]
  );
  await audit({ req, action: 'documents.reject', entityType: 'version', entityId: versionId, comment: comments });

  res.json({ message: 'Documento rejeitado.' });
}

module.exports = { getPending, getAll, approve, reject };
