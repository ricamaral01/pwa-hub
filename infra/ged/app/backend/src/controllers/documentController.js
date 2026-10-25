const multer = require('multer');
const path = require('path');
const { query } = require('../config/database');
const documentService = require('../services/documentService');
const storageService = require('../services/storageService');
const { audit } = require('../services/auditService');
const { getDepartmentAccess, hasPermission } = require('../services/rbacService');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  // Busboy emits LIMIT_FILE_SIZE at the exact cap, so allow one framing byte
  // while preserving the effective 50 MiB file ceiling.
  limits: { fileSize: 50 * 1024 * 1024 + 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Tipo de arquivo não permitido: ${ext}`));
  },
}).single('file');


async function addDocumentScope(req, conditions, params, alias = 'd') {
  if (await hasPermission(req.user, 'documents.manage')) return;

  const departments = await getDepartmentAccess(req.user.id);
  const areaCodesResult = departments.length
    ? await query(
      `SELECT code FROM departments WHERE id = ANY($1::uuid[]) AND company_id = $2`,
      [departments, req.user.company_id]
    )
    : { rows: [] };

  const areaCodes = new Set(areaCodesResult.rows.map((row) => row.code));
  if (req.user.managed_area) areaCodes.add(req.user.managed_area);

  if (!departments.length && !areaCodes.size) {
    conditions.push('1 = 0');
    return;
  }

  const clauses = [];
  if (departments.length) {
    params.push(departments);
    clauses.push(`${alias}.department_id = ANY($${params.length}::uuid[])`);
  }
  if (areaCodes.size) {
    params.push(Array.from(areaCodes));
    clauses.push(`${alias}.area::text = ANY($${params.length}::text[])`);
  }

  conditions.push(`(${clauses.join(' OR ')})`);
}

async function list(req, res) {
  const { area, status, code, name } = req.query;
  const params = [req.user.company_id];
  const conditions = ['d.company_id = $1'];

  if (area) { params.push(area); conditions.push(`d.area = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`d.status = $${params.length}`); }
  if (code) { params.push(`%${code}%`); conditions.push(`d.code ILIKE $${params.length}`); }
  if (name) { params.push(`%${name}%`); conditions.push(`d.name ILIKE $${params.length}`); }
  await addDocumentScope(req, conditions, params, 'd');

  const result = await query(
    `SELECT d.*, u.name AS created_by_name,
            v.drive_web_url AS current_file_url,
            v.file_name AS current_file_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.created_by
     LEFT JOIN versions v ON v.id = d.current_version_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY d.updated_at DESC`,
    params
  );
  res.json(result.rows);
}

async function getById(req, res) {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return res.status(400).json({ error: 'ID inv?lido.' });

  const params = [id, req.user.company_id];
  const conditions = ['d.id = $1', 'd.company_id = $2'];
  await addDocumentScope(req, conditions, params, 'd');

  const result = await query(
    `SELECT d.*, u.name AS created_by_name,
            v.drive_web_url AS current_file_url,
            v.file_name AS current_file_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.created_by
     LEFT JOIN versions v ON v.id = d.current_version_id
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Documento n?o encontrado.' });
  res.json(result.rows[0]);
}

async function expiring(req, res) {
  const params = [req.user.company_id];
  const conditions = [
    'd.valid_until IS NOT NULL',
    `d.status = 'APROVADO'`,
    'd.company_id = $1',
    `d.valid_until <= CURRENT_DATE + INTERVAL '30 days'`,
  ];
  await addDocumentScope(req, conditions, params, 'd');

  const result = await query(
    `SELECT d.id, d.code, d.name, d.area, d.valid_until,
            (d.valid_until - CURRENT_DATE) AS days_to_expire
     FROM documents d
     WHERE ${conditions.join(' AND ')}
     ORDER BY d.valid_until ASC`,
    params
  );
  res.json(result.rows);
}

async function stats(req, res) {
  const params = [req.user.company_id];
  const conditions = ['d.company_id = $1'];
  await addDocumentScope(req, conditions, params, 'd');

  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE d.status = 'APROVADO') AS aprovados,
      COUNT(*) FILTER (WHERE d.status = 'EM_REVISAO') AS em_revisao,
      COUNT(*) FILTER (WHERE d.status = 'OBSOLETO') AS obsoletos,
      COUNT(*) AS total
     FROM documents d
     WHERE ${conditions.join(' AND ')}`,
    params
  );
  res.json(result.rows[0]);
}

async function statsByArea(req, res) {
  const params = [req.user.company_id];
  const conditions = ['d.company_id = $1'];
  await addDocumentScope(req, conditions, params, 'd');

  const result = await query(
    `SELECT d.area, d.status, COUNT(*)::int AS count
     FROM documents d
     WHERE ${conditions.join(' AND ')}
     GROUP BY d.area, d.status`,
    params
  );
  res.json(result.rows);
}

async function getVersions(req, res) {
  const params = [req.params.id, req.user.company_id];
  const conditions = ['v.document_id = $1', 'd.company_id = $2'];
  await addDocumentScope(req, conditions, params, 'd');

  const result = await query(
    `SELECT v.*,
            u.name AS uploaded_by_name,
            CASE
              WHEN COUNT(a.id) FILTER (WHERE a.status = 'REJEITADO') > 0 THEN 'REJEITADO'
              WHEN COUNT(a.id) > 0 AND COUNT(a.id) = COUNT(a.id) FILTER (WHERE a.status = 'APROVADO') THEN 'APROVADO'
              WHEN COUNT(a.id) FILTER (WHERE a.status = 'PENDENTE') > 0 THEN 'PENDENTE'
              ELSE NULL
            END AS approval_status,
            STRING_AGG(DISTINCT NULLIF(a.comments, ''), ' | ') FILTER (WHERE NULLIF(a.comments, '') IS NOT NULL) AS approval_comments,
            MAX(a.resolved_at) AS resolved_at,
            STRING_AGG(DISTINCT au.name, ', ' ORDER BY au.name) FILTER (WHERE au.name IS NOT NULL) AS approved_by_name
     FROM versions v
     JOIN documents d ON d.id = v.document_id
     LEFT JOIN users u ON u.id = v.uploaded_by
     LEFT JOIN approvals a ON a.version_id = v.id
     LEFT JOIN users au ON au.id = a.approved_by
     WHERE ${conditions.join(' AND ')}
     GROUP BY v.id, u.name
     ORDER BY v.revision_number DESC`,
    params
  );
  res.json(result.rows);
}

async function create(req, res) {
  const { code, name, area, doc_type, description, valid_until, initial_revision } = req.body;
  if (!code || !name || !area || !doc_type) {
    return res.status(400).json({ error: 'code, name, area e doc_type são obrigatórios.' });
  }
  const revision = Number.isInteger(Number(initial_revision)) && Number(initial_revision) >= 0
    ? Number(initial_revision)
    : 0;
  const result = await query(
    `INSERT INTO documents (code, name, area, doc_type, description, valid_until, current_revision, created_by, company_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [code.toUpperCase(), name, area, doc_type, description, valid_until || null, revision, req.user.id, req.user.company_id]
  );
  await audit({ req, action: 'documents.create', entityType: 'document', entityId: result.rows[0].id, after: result.rows[0] });
  res.status(201).json(result.rows[0]);
}

function uploadVersion(req, res) {
  upload(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório.' });
      const { id } = req.params;
      const version = await documentService.createNewVersion(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user.id,
        req.body.change_summary || null
      );
      if (version.processing_warning) {
        await audit({ req, action: 'documents.pdf_stamp_fallback', entityType: 'version',
          entityId: version.id, after: { processing_warning: version.processing_warning } });
      }
      await audit({ req, action: 'documents.upload', entityType: 'document', entityId: id, after: version, comment: req.body.change_summary || null });
      res.status(201).json(version);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      console.error('[documentController] Erro ao enviar versão:', error?.name || 'Error');
      res.status(500).json({ error: 'Erro ao enviar arquivo.' });
    }
  });
}

async function update(req, res) {
  const { name, area, doc_type, description, valid_until } = req.body;
  const result = await query(
    `UPDATE documents
     SET name = $1, area = $2, doc_type = $3, description = $4,
         valid_until = $5, updated_at = NOW()
     WHERE id = $6 AND company_id = $7
     RETURNING *`,
    [name, area, doc_type, description, valid_until, req.params.id, req.user.company_id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Documento não encontrado.' });
  await audit({ req, action: 'documents.update', entityType: 'document', entityId: req.params.id, after: result.rows[0] });
  res.json(result.rows[0]);
}

async function remove(req, res) {
  const existing = await query(
    `SELECT * FROM documents WHERE id = $1 AND company_id = $2`,
    [req.params.id, req.user.company_id]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Documento n?o encontrado.' });

  await query(
    `DELETE FROM documents WHERE id = $1 AND company_id = $2`,
    [req.params.id, req.user.company_id]
  );

  await audit({
    req,
    action: 'documents.delete',
    entityType: 'document',
    entityId: req.params.id,
    before: existing.rows[0],
  });

  res.json({ message: 'Documento exclu?do com sucesso.' });
}

async function publish(req, res) {
  const result = await query(
    `SELECT d.id, d.current_version_id, d.status,
            v.drive_file_id, v.drive_folder, v.drive_web_url
     FROM documents d
     JOIN versions v ON v.id = d.current_version_id
     WHERE d.id = $1 AND d.company_id = $2`,
    [req.params.id, req.user.company_id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Documento não encontrado.' });
  const doc = result.rows[0];
  if (!doc.current_version_id) return res.status(400).json({ error: 'Documento sem versão para publicar.' });
  if (doc.status === 'APROVADO') return res.json({ message: 'Documento já está publicado.' });

  let moved = null;
  if (doc.drive_file_id && doc.drive_folder === 'EM_REVISAO') {
    moved = await storageService.moveFile(doc.drive_file_id, 'EM_REVISAO', 'VIGENTES').catch((err) => {
      console.error('[documentController] Falha ao mover arquivo para VIGENTES:', err.message);
      return null;
    });
  }

  await query(
    `UPDATE approvals
     SET status = 'APROVADO', approved_by = $1, resolved_at = NOW(),
         comments = COALESCE(comments, 'Publicado diretamente pelo Administrador.')
     WHERE version_id = $2 AND status = 'PENDENTE'`,
    [req.user.id, doc.current_version_id]
  );

  await query(
    `UPDATE versions
     SET drive_folder = 'VIGENTES',
         drive_file_id = COALESCE($2, drive_file_id),
         drive_web_url = COALESCE($3, drive_web_url)
     WHERE id = $1`,
    [doc.current_version_id, moved?.id || null, moved?.webViewLink || null]
  );

  await query(
    `UPDATE versions
     SET drive_folder = 'OBSOLETOS'
     WHERE document_id = $1 AND id <> $2 AND drive_folder = 'VIGENTES'`,
    [req.params.id, doc.current_version_id]
  );

  const updated = await query(
    `UPDATE documents
     SET status = 'APROVADO', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );
  await audit({ req, action: 'documents.publish', entityType: 'document', entityId: req.params.id, after: updated.rows[0] });

  res.json({ message: 'Documento publicado com sucesso.', document: updated.rows[0] });
}

async function makeObsolete(req, res) {
  const result = await query(
    `SELECT d.id, d.current_version_id, d.status,
            v.drive_file_id, v.drive_folder
     FROM documents d
     LEFT JOIN versions v ON v.id = d.current_version_id
     WHERE d.id = $1 AND d.company_id = $2`,
    [req.params.id, req.user.company_id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Documento não encontrado.' });
  const doc = result.rows[0];
  if (doc.status === 'OBSOLETO') return res.json({ message: 'Documento já está obsoleto.' });

  let moved = null;
  if (doc.drive_file_id && doc.drive_folder !== 'OBSOLETOS') {
    moved = await storageService.moveFile(doc.drive_file_id, doc.drive_folder, 'OBSOLETOS').catch((err) => {
      console.error('[documentController] Falha ao mover arquivo para OBSOLETOS:', err.message);
      return null;
    });
  }

  if (doc.current_version_id) {
    await query(
      `UPDATE versions
       SET drive_folder = 'OBSOLETOS',
           drive_file_id = COALESCE($2, drive_file_id),
           drive_web_url = COALESCE($3, drive_web_url)
       WHERE id = $1`,
      [doc.current_version_id, moved?.id || null, moved?.webViewLink || null]
    );
  }

  await query(
    `UPDATE approvals
     SET status = 'REJEITADO', approved_by = $1, resolved_at = NOW(),
         comments = COALESCE(comments, 'Documento tornado obsoleto pelo Administrador.')
     WHERE document_id = $2 AND status = 'PENDENTE'`,
    [req.user.id, req.params.id]
  );

  const updated = await query(
    `UPDATE documents
     SET status = 'OBSOLETO', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );
  await audit({ req, action: 'documents.make_obsolete', entityType: 'document', entityId: req.params.id, after: updated.rows[0] });

  res.json({ message: 'Documento tornado obsoleto com sucesso.', document: updated.rows[0] });
}

module.exports = { list, stats, statsByArea, getById, getVersions, create, uploadVersion, update, remove, publish, makeObsolete, expiring };
