const path = require('path');
const { query } = require('../config/database');
const storageService = require('./storageService');
const pdfStampService = require('./pdfStampService');
const emailService = require('./emailService');

async function resolveApprovers(doc, uploadedBy) {
  const managersResult = await query(
    `SELECT u.id, u.name, u.email, u.role, u.managed_area, u.department_id, dpt.code AS department_code
     FROM users u
     LEFT JOIN departments dpt ON dpt.id = u.department_id AND dpt.company_id = u.company_id
     WHERE u.active = TRUE
       AND u.company_id = $1
       AND (
         u.managed_area::text IN ($2::text, 'SGQ')
         OR dpt.code IN ($2::text, 'SGQ')
         OR u.role IN ('ADMIN', 'ADMIN_MASTER', 'QUALIDADE')
       )
     ORDER BY
       CASE
         WHEN u.managed_area::text = 'SGQ' OR dpt.code = 'SGQ' THEN 1
         WHEN u.managed_area::text = $2::text OR dpt.code = $2::text THEN 2
         WHEN u.role = 'QUALIDADE' THEN 3
         WHEN u.role IN ('ADMIN', 'ADMIN_MASTER') THEN 4
         ELSE 5
       END,
       u.name`,
    [doc.company_id, doc.area]
  );

  const managesArea = (user, area) => user?.managed_area === area || user?.department_code === area;
  const sgqManager =
    managersResult.rows.find((user) => managesArea(user, 'SGQ')) ||
    managersResult.rows.find((user) => user.role === 'QUALIDADE') ||
    managersResult.rows.find((user) => user.role === 'ADMIN_MASTER') ||
    managersResult.rows.find((user) => user.role === 'ADMIN');

  const areaManager =
    managersResult.rows.find((user) => managesArea(user, doc.area) && user.id !== sgqManager?.id) ||
    managersResult.rows.find((user) => ['ADMIN_MASTER', 'ADMIN'].includes(user.role) && user.id !== sgqManager?.id) ||
    (['ADMIN_MASTER', 'ADMIN'].includes(sgqManager?.role) ? sgqManager : null);

  const uploaderResult = await query(
    `SELECT role FROM users WHERE id = $1 AND company_id = $2`,
    [uploadedBy, doc.company_id]
  );
  const uploaderRole = uploaderResult.rows[0]?.role;

  if (!sgqManager) {
    const err = new Error('Nenhum usuário ativo de SGQ/Qualidade configurado para revisar documentos.');
    err.name = 'ValidationError';
    throw err;
  }

  if (!areaManager) {
    const err = new Error(`Nenhum gestor ativo configurado para aprovação da área ${doc.area}. Cadastre um usuário ativo com essa área gerenciada ou um ADMIN.`);
    err.name = 'ValidationError';
    throw err;
  }

  if (!['ADMIN', 'ADMIN_MASTER'].includes(uploaderRole) && (uploadedBy === sgqManager.id || uploadedBy === areaManager.id)) {
    const err = new Error('Quem submete o documento não pode revisar/aprovar a própria versão. Submeta com outro usuário ou ajuste as alçadas.');
    err.name = 'ValidationError';
    throw err;
  }

  return { sgqManager, areaManager };
}

/**
 * Cria uma nova versão de um documento existente.
 *
 * Fluxo:
 * 1. Incrementar revisão no documento
 * 2. Mover versão atual para OBSOLETOS no Drive (se existir)
 * 3. Stampar cabeçalho no PDF (se for PDF)
 * 4. Upload do novo arquivo para EM_REVISAO no Drive
 * 5. Inserir registro em `versions`
 * 6. Criar cadeia de aprovação em 2 níveis (SGQ -> gestor da área)
 * 7. Atualizar documento (status EM_REVISAO, current_version_id, updated_at)
 * 8. Disparar email para o aprovador de primeiro nível
 *
 * @param {string} documentId   UUID do documento
 * @param {Buffer} fileBuffer   Buffer do arquivo enviado
 * @param {string} fileName     Nome do arquivo (original)
 * @param {string} mimeType     MIME type
 * @param {string} uploadedBy   UUID do usuário que fez o upload
 * @returns {object}            Versão criada
 */
async function createNewVersion(documentId, fileBuffer, fileName, mimeType, uploadedBy, changeSummary = null) {
  // 1. Buscar documento atual
  const docResult = await query(
    `SELECT d.*, v.drive_file_id as current_drive_id, v.drive_folder as current_drive_folder
     FROM documents d
     LEFT JOIN versions v ON v.id = d.current_version_id
     WHERE d.id = $1`,
    [documentId]
  );

  if (!docResult.rows.length) {
    const err = new Error('Documento não encontrado.');
    err.name = 'ValidationError';
    throw err;
  }

  const doc = docResult.rows[0];
  // Valida toda a cadeia antes de mover ou gravar arquivos e versões.
  const { sgqManager, areaManager } = await resolveApprovers(doc, uploadedBy);
  // Para o primeiro upload (sem versão anterior), usa current_revision diretamente (= initial_revision).
  // Para versões subsequentes, incrementa.
  const newRevision = doc.current_version_id ? doc.current_revision + 1 : doc.current_revision;

  // 2. Mover versão atual para OBSOLETOS (se houver arquivo)
  if (doc.current_drive_id && doc.current_drive_folder === 'VIGENTES') {
    try {
      const moved = await storageService.moveFile(doc.current_drive_id, 'VIGENTES', 'OBSOLETOS');
      await query(
        `UPDATE versions SET drive_folder = 'OBSOLETOS', drive_file_id = $2, drive_web_url = $3 WHERE id = $1`,
        [doc.current_version_id, moved.id, moved.webViewLink]
      );
    } catch (err) {
      console.error('[documentService] Falha ao mover arquivo para OBSOLETOS:', err?.name || 'Error');
    }
  }

  // Marcar documento anterior como OBSOLETO se estava APROVADO
  if (doc.current_version_id) {
    await query(
      `UPDATE documents SET status = 'EM_REVISAO', updated_at = NOW() WHERE id = $1`,
      [documentId]
    );
  }

  // 3. Stampar cabeçalho no PDF
  let processedBuffer = fileBuffer;
  let processingWarning = null;
  if (mimeType === 'application/pdf') {
    const stamp = await pdfStampService.stampInChild(fileBuffer, doc.code, newRevision);
    processedBuffer = stamp.buffer;
    processingWarning = stamp.warning;
    if (processingWarning) console.warn(`[documentService] ${processingWarning} reason=${stamp.reason}`);
  }

  // 4. Salvar arquivo localmente (pasta EM_REVISAO)
  const ext = path.extname(fileName);
  const storageFileName = `${doc.code}_Rev${String(newRevision).padStart(2, '0')}${ext}`;

  let driveFileId = null;
  let driveWebUrl = null;

  try {
    const result = await storageService.uploadFile(
      processedBuffer,
      storageFileName,
      mimeType,
      'EM_REVISAO'
    );
    driveFileId = result.id;
    driveWebUrl = result.webViewLink;
  } catch (err) {
    console.error('[documentService] Falha ao salvar arquivo:', err?.name || 'Error');
  }

  // 5. Inserir versão no banco
  const versionResult = await query(
    `INSERT INTO versions
       (document_id, revision_number, file_name, original_name, mime_type, file_size, drive_file_id, drive_folder, drive_web_url, uploaded_by, change_summary, processing_warning)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'EM_REVISAO', $8, $9, $10, $11)
     RETURNING *`,
    [
      documentId,
      newRevision,
      storageFileName,
      fileName,
      mimeType,
      processedBuffer.length,
      driveFileId,
      driveWebUrl,
      uploadedBy,
      changeSummary,
      processingWarning,
    ]
  );

  const newVersion = versionResult.rows[0];

  // 6. Criar aprovações PENDENTES por nível: SGQ revisa, gestor aprova.
  await query(
    `INSERT INTO approvals (version_id, document_id, requested_by, required_approver_id, approval_level, status, company_id)
     VALUES
       ($1, $2, $3, $4, 1, 'PENDENTE', $6),
       ($1, $2, $3, $5, 2, 'PENDENTE', $6)`,
    [newVersion.id, documentId, uploadedBy, sgqManager.id, areaManager.id, doc.company_id]
  );

  // 7. Atualizar documento
  await query(
    `UPDATE documents
     SET current_revision = $1, status = 'EM_REVISAO', current_version_id = $2, updated_at = NOW()
     WHERE id = $3`,
    [newRevision, newVersion.id, documentId]
  );

  // 8. Enviar email para o aprovador do primeiro nível
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const revStr = `Rev ${String(newRevision).padStart(2, '0')}`;

    await emailService.sendApprovalRequest(
      sgqManager.email,
      doc.name,
      doc.code,
      revStr,
      `${frontendUrl}/approvals`
    );
  } catch (err) {
    console.error('[documentService] Falha ao enviar emails de aprovação:', err?.name || 'Error');
  }

  return newVersion;
}

module.exports = { createNewVersion };
