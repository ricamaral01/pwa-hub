const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { query } = require('../config/database');

const ALLOWED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido para anexo de RNC.'));
    }
  },
}).single('file');

function canManageRnc(user) {
  return ['ADMIN', 'ADMIN_MASTER', 'QUALIDADE'].includes(user.role);
}

function canUseRnc(user) {
  return ['ADMIN', 'ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO'].includes(user.role);
}

async function listUsers(req, res) {
  const result = await query(
    `SELECT id, name, email, role, managed_area
     FROM users
     WHERE active = TRUE
       AND company_id IS NOT DISTINCT FROM COALESCE($1, (SELECT company_id FROM users WHERE id = $2))
     ORDER BY name`,
    [req.user.company_id || null, req.user.id]
  );
  res.json(result.rows);
}

function normalizeRootCauseMethod(method) {
  const map = {
    CINCO_PORQUES: '5_PORQUES',
    '5_PORQUES': '5_PORQUES',
    ISHIKAWA: 'ISHIKAWA_6M',
    ISHIKAWA_6M: 'ISHIKAWA_6M',
    PARETO: 'PARETO',
    ESTRATIFICACAO: 'ESTRATIFICACAO',
    FALHA_CLASSIFICADA: 'FALHA_CLASSIFICADA',
  };

  return map[method] || null;
}

async function appendHistory(rncId, eventType, description, userId, metadata = {}) {
  await query(
    `INSERT INTO rnc_history (rnc_id, event_type, description, metadata, created_by)
     VALUES ($1, $2::rnc_history_type, $3, $4::jsonb, $5)`,
    [rncId, eventType, description, JSON.stringify(metadata || {}), userId || null]
  );
}

async function getRncByIdRaw(id) {
  const result = await query(
    `SELECT
       r.*,
       cu.name AS created_by_name,
       ru.name AS responsible_name,
       au.name AS assigned_by_name,
       uu.name AS updated_by_name,
       cl.name AS closed_by_name,
       ro.name AS reopened_by_name
     FROM rnc_reports r
     JOIN users cu ON cu.id = r.created_by
     LEFT JOIN users ru ON ru.id = r.responsible_sector_user_id
     LEFT JOIN users au ON au.id = r.assigned_by
     LEFT JOIN users uu ON uu.id = r.updated_by
     LEFT JOIN users cl ON cl.id = r.closed_by
     LEFT JOIN users ro ON ro.id = r.reopened_by
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

function assertAccess(rnc, user) {
  if (canManageRnc(user)) return;

  const managesDestination = !!user.managed_area && user.managed_area === rnc.destination_area;
  const isOwner = rnc.created_by === user.id;
  const isResponsible = rnc.responsible_sector_user_id === user.id;

  if (!(managesDestination || isOwner || isResponsible)) {
    const err = new Error('FORBIDDEN');
    throw err;
  }
}

async function list(req, res) {
  if (!canUseRnc(req.user)) {
    return res.status(403).json({ error: 'Sem permissão para acessar RNC.' });
  }

  const {
    status,
    severity,
    destination_area,
    emitter_area,
    origin,
    search,
    mine,
    assigned_to_me,
  } = req.query;

  const params = [];
  const conditions = [];
  let idx = 1;

  if (status) { conditions.push(`r.status = $${idx++}::rnc_status`); params.push(status); }
  if (severity) { conditions.push(`r.severity = $${idx++}::rnc_severity`); params.push(severity); }
  if (destination_area) { conditions.push(`r.destination_area = $${idx++}`); params.push(destination_area); }
  if (emitter_area) { conditions.push(`r.emitter_area = $${idx++}`); params.push(emitter_area); }
  if (origin) { conditions.push(`r.origin = $${idx++}::rnc_origin`); params.push(origin); }
  if (search) {
    conditions.push(`(r.number ILIKE $${idx} OR r.title ILIKE $${idx} OR r.description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }

  if (mine === 'true') {
    conditions.push(`r.created_by = $${idx++}`);
    params.push(req.user.id);
  }

  if (assigned_to_me === 'true') {
    conditions.push(`r.responsible_sector_user_id = $${idx++}`);
    params.push(req.user.id);
  }

  if (!canManageRnc(req.user)) {
    conditions.push(`(
      r.created_by = $${idx}
      OR r.responsible_sector_user_id = $${idx}
      OR ($${idx + 1}::text IS NOT NULL AND r.destination_area::text = $${idx + 1}::text)
    )`);
    params.push(req.user.id, req.user.managed_area || null);
    idx += 2;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT
       r.id,
       r.number,
       r.title,
       r.status,
       r.severity,
       r.origin,
       r.rnc_type,
       r.emitter_area,
       r.destination_area,
       r.occurrence_at,
       r.due_date,
       r.created_at,
       r.updated_at,
       cu.name AS created_by_name,
       ru.name AS responsible_name,
       COUNT(ap.id)::int AS actions_count,
       COUNT(ap.id) FILTER (WHERE ap.status <> 'CONCLUIDA')::int AS actions_open_count
     FROM rnc_reports r
     JOIN users cu ON cu.id = r.created_by
     LEFT JOIN users ru ON ru.id = r.responsible_sector_user_id
     LEFT JOIN rnc_action_plans ap ON ap.rnc_id = r.id
     ${where}
     GROUP BY r.id, cu.name, ru.name
     ORDER BY r.created_at DESC`,
    params
  );

  res.json(result.rows);
}

async function getById(req, res) {
  if (!canUseRnc(req.user)) {
    return res.status(403).json({ error: 'Sem permissão para acessar RNC.' });
  }

  const rnc = await getRncByIdRaw(req.params.id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  assertAccess(rnc, req.user);

  const [rootCause, actions, attachments, effectiveness, history] = await Promise.all([
    query(
      `SELECT rc.*, u.name AS created_by_name, v.name AS validated_by_name
       FROM rnc_root_cause_analyses rc
       JOIN users u ON u.id = rc.created_by
       LEFT JOIN users v ON v.id = rc.validated_by
       WHERE rc.rnc_id = $1`,
      [rnc.id]
    ),
    query(
      `SELECT ap.*, wu.name AS responsible_name, cu.name AS created_by_name, vu.name AS verified_by_name
       FROM rnc_action_plans ap
       JOIN users cu ON cu.id = ap.created_by
       LEFT JOIN users wu ON wu.id = ap.who_user_id
       LEFT JOIN users vu ON vu.id = ap.verified_by
       WHERE ap.rnc_id = $1
       ORDER BY ap.when_due ASC NULLS LAST, ap.created_at ASC`,
      [rnc.id]
    ),
    query(
      `SELECT a.*, u.name AS uploaded_by_name
       FROM rnc_attachments a
       JOIN users u ON u.id = a.uploaded_by
       WHERE a.rnc_id = $1
       ORDER BY a.created_at DESC`,
      [rnc.id]
    ),
    query(
      `SELECT er.*, u.name AS reviewed_by_name
       FROM rnc_effectiveness_reviews er
       JOIN users u ON u.id = er.reviewed_by
       WHERE er.rnc_id = $1`,
      [rnc.id]
    ),
    query(
      `SELECT h.*, u.name AS created_by_name
       FROM rnc_history h
       LEFT JOIN users u ON u.id = h.created_by
       WHERE h.rnc_id = $1
       ORDER BY h.created_at DESC`,
      [rnc.id]
    ),
  ]);

  res.json({
    report: rnc,
    root_cause: rootCause.rows[0] || null,
    actions: actions.rows,
    attachments: attachments.rows,
    effectiveness_review: effectiveness.rows[0] || null,
    history: history.rows,
  });
}

async function create(req, res) {
  if (!canUseRnc(req.user)) {
    return res.status(403).json({ error: 'Sem permissão para criar RNC.' });
  }

  const {
    title,
    severity,
    origin,
    rnc_type,
    emitter_area,
    destination_area,
    occurrence_at,
    detected_at,
    requirement_reference,
    description,
    evidence_description,
    impact_description,
    containment_action,
    source_reference,
    product_reference,
    process_reference,
    lot_reference,
    supplier_reference,
    customer_reference,
    order_reference,
    responsible_sector_user_id,
    due_date,
  } = req.body;

  if (!title || !origin || !description || !destination_area || !emitter_area) {
    return res.status(400).json({ error: 'title, origin, description, emitter_area e destination_area sao obrigatorios.' });
  }

  const seqResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM rnc_reports
     WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', NOW())`
  );

  const seq = seqResult.rows[0].total + 1;
  const year = new Date().getFullYear();
  const number = `RNC-${year}-${String(seq).padStart(4, '0')}`;

  const result = await query(
    `INSERT INTO rnc_reports (
       number, title, status, severity, origin, rnc_type,
       emitter_area, destination_area, occurrence_at, detected_at,
       requirement_reference, description, evidence_description, impact_description,
       containment_action, source_reference, product_reference, process_reference,
       lot_reference, supplier_reference, customer_reference, order_reference,
       responsible_sector_user_id, due_date, created_by, updated_by
     ) VALUES (
       $1, $2, 'ABERTA', COALESCE($3::rnc_severity, 'MEDIA'::rnc_severity), $4::rnc_origin, COALESCE($5::rnc_type, 'PROCESSO'::rnc_type),
       $6, $7, COALESCE($8, NOW()), COALESCE($9, NOW()),
       $10, $11, $12, $13,
       $14, $15, $16, $17,
       $18, $19, $20, $21,
       $22, $23, $24, $24
     )
     RETURNING *`,
    [
      number,
      title,
      severity || null,
      origin,
      rnc_type || null,
      emitter_area,
      destination_area,
      occurrence_at || null,
      detected_at || null,
      requirement_reference || null,
      description,
      evidence_description || null,
      impact_description || null,
      containment_action || null,
      source_reference || null,
      product_reference || null,
      process_reference || null,
      lot_reference || null,
      supplier_reference || null,
      customer_reference || null,
      order_reference || null,
      responsible_sector_user_id || null,
      due_date || null,
      req.user.id,
    ]
  );

  await appendHistory(result.rows[0].id, 'ABERTURA', 'RNC aberta.', req.user.id, {
    number,
    destination_area,
    severity: severity || 'MEDIA',
  });

  res.status(201).json(result.rows[0]);
}

async function triage(req, res) {
  if (!canManageRnc(req.user)) {
    return res.status(403).json({ error: 'Apenas ADMIN/QUALIDADE podem triar RNC.' });
  }

  const { id } = req.params;
  const { triage_notes, responsible_sector_user_id, due_date, status } = req.body;

  const existing = await getRncByIdRaw(id);
  if (!existing) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  const nextStatus = status || 'TRIAGEM_SGQ';
  const result = await query(
    `UPDATE rnc_reports
     SET triage_notes = COALESCE($1, triage_notes),
         responsible_sector_user_id = COALESCE($2, responsible_sector_user_id),
         due_date = COALESCE($3, due_date),
       status = $4::rnc_status,
         assigned_by = $5,
         updated_by = $5,
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [triage_notes || null, responsible_sector_user_id || null, due_date || null, nextStatus, req.user.id, id]
  );

  await appendHistory(id, 'TRIAGEM', 'Triagem SGQ registrada.', req.user.id, {
    previous_status: existing.status,
    next_status: nextStatus,
    responsible_sector_user_id: responsible_sector_user_id || existing.responsible_sector_user_id,
  });

  res.json(result.rows[0]);
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status e obrigatorio.' });
  }

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  assertAccess(rnc, req.user);

  const result = await query(
    `UPDATE rnc_reports
     SET status = $1::rnc_status,
         updated_by = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, req.user.id, id]
  );

  await appendHistory(id, 'MUDANCA_STATUS', `Status alterado para ${status}.`, req.user.id, {
    previous_status: rnc.status,
    next_status: status,
    notes: notes || null,
  });

  res.json(result.rows[0]);
}

async function upsertRootCause(req, res) {
  const { id } = req.params;
  const {
    method,
    problem_statement,
    direct_cause,
    root_cause,
    contributing_causes,
    method_payload,
    validated_by,
  } = req.body;

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  assertAccess(rnc, req.user);

  if (!method || !problem_statement || !root_cause) {
    return res.status(400).json({ error: 'method, problem_statement e root_cause sao obrigatorios.' });
  }

  const normalizedMethod = normalizeRootCauseMethod(method);
  if (!normalizedMethod) {
    return res.status(400).json({ error: 'method inválido para analise de causa raiz.' });
  }

  const result = await query(
    `INSERT INTO rnc_root_cause_analyses (
       rnc_id, method, problem_statement, direct_cause, root_cause,
       contributing_causes, method_payload, validated_by, created_by
     ) VALUES ($1, $2::rnc_root_cause_method, $3, $4, $5, $6, $7::jsonb, $8, $9)
     ON CONFLICT (rnc_id)
     DO UPDATE SET
       method = EXCLUDED.method,
       problem_statement = EXCLUDED.problem_statement,
       direct_cause = EXCLUDED.direct_cause,
       root_cause = EXCLUDED.root_cause,
       contributing_causes = EXCLUDED.contributing_causes,
       method_payload = EXCLUDED.method_payload,
       validated_by = EXCLUDED.validated_by,
       updated_at = NOW()
     RETURNING *`,
    [
      id,
      normalizedMethod,
      problem_statement,
      direct_cause || null,
      root_cause,
      contributing_causes || null,
      JSON.stringify(method_payload || {}),
      validated_by || null,
      req.user.id,
    ]
  );

  if (rnc.status === 'ABERTA' || rnc.status === 'TRIAGEM_SGQ') {
    await query(
      `UPDATE rnc_reports
       SET status = 'EM_ANALISE', updated_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );
  }

  await appendHistory(id, 'ANALISE_CAUSA', 'Análise de causa raiz registrada/atualizada.', req.user.id, {
    method: normalizedMethod,
  });

  res.json(result.rows[0]);
}

async function addAction(req, res) {
  const { id } = req.params;
  const {
    action_type,
    action_description,
    why,
    where_action,
    who_user_id,
    when_due,
    how,
    how_much,
  } = req.body;

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  assertAccess(rnc, req.user);

  if (!action_description) {
    return res.status(400).json({ error: 'action_description e obrigatorio.' });
  }

  const result = await query(
    `INSERT INTO rnc_action_plans (
       rnc_id, action_type, action_description, why, where_action,
       who_user_id, when_due, how, how_much, created_by
     ) VALUES ($1, COALESCE($2::rnc_action_type, 'CORRETIVA'::rnc_action_type), $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      action_type || null,
      action_description,
      why || null,
      where_action || null,
      who_user_id || null,
      when_due || null,
      how || null,
      how_much || null,
      req.user.id,
    ]
  );

  if (['ABERTA', 'TRIAGEM_SGQ', 'EM_ANALISE'].includes(rnc.status)) {
    await query(
      `UPDATE rnc_reports
       SET status = 'PLANO_EM_EXECUCAO', updated_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );
  }

  await appendHistory(id, 'PLANO_ACAO', 'Item de plano de ação adicionado.', req.user.id, {
    action_id: result.rows[0].id,
    action_type: result.rows[0].action_type,
  });

  res.status(201).json(result.rows[0]);
}

async function updateAction(req, res) {
  const { id, actionId } = req.params;
  const {
    status,
    evidence,
    verification_notes,
    verified_by,
    completed_at,
    when_due,
    who_user_id,
  } = req.body;

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  assertAccess(rnc, req.user);

  const existing = await query(
    `SELECT * FROM rnc_action_plans WHERE id = $1 AND rnc_id = $2`,
    [actionId, id]
  );
  if (!existing.rows.length) {
    return res.status(404).json({ error: 'Acao nao encontrada para esta RNC.' });
  }

  const result = await query(
    `UPDATE rnc_action_plans
     SET status = COALESCE($1::rnc_action_status, status),
         evidence = COALESCE($2, evidence),
         verification_notes = COALESCE($3, verification_notes),
         verified_by = COALESCE($4, verified_by),
         completed_at = COALESCE($5, completed_at),
         when_due = COALESCE($6, when_due),
         who_user_id = COALESCE($7, who_user_id),
         updated_at = NOW()
     WHERE id = $8 AND rnc_id = $9
     RETURNING *`,
    [
      status || null,
      evidence || null,
      verification_notes || null,
      verified_by || null,
      completed_at || null,
      when_due || null,
      who_user_id || null,
      actionId,
      id,
    ]
  );

  const pendingCount = await query(
    `SELECT COUNT(*)::int AS total
     FROM rnc_action_plans
     WHERE rnc_id = $1 AND status <> 'CONCLUIDA'`,
    [id]
  );

  if (pendingCount.rows[0].total === 0 && rnc.status !== 'ENCERRADA') {
    await query(
      `UPDATE rnc_reports
       SET status = 'AGUARDANDO_EFICACIA', updated_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );
  }

  await appendHistory(id, 'PLANO_ACAO', 'Item de plano de ação atualizado.', req.user.id, {
    action_id: actionId,
    status: result.rows[0].status,
  });

  res.json(result.rows[0]);
}

async function reviewEffectiveness(req, res) {
  const { id } = req.params;
  const { effectiveness_result, notes, follow_up_required } = req.body;

  if (!canManageRnc(req.user)) {
    return res.status(403).json({ error: 'Apenas ADMIN/QUALIDADE podem avaliar eficacia.' });
  }

  if (typeof effectiveness_result !== 'boolean') {
    return res.status(400).json({ error: 'effectiveness_result deve ser boolean.' });
  }

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  const result = await query(
    `INSERT INTO rnc_effectiveness_reviews (rnc_id, effectiveness_result, reviewed_by, notes, follow_up_required)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (rnc_id)
     DO UPDATE SET
       effectiveness_result = EXCLUDED.effectiveness_result,
       reviewed_by = EXCLUDED.reviewed_by,
       reviewed_at = NOW(),
       notes = EXCLUDED.notes,
       follow_up_required = EXCLUDED.follow_up_required
     RETURNING *`,
    [id, effectiveness_result, req.user.id, notes || null, !!follow_up_required]
  );

  const nextStatus = effectiveness_result ? 'ENCERRADA' : 'REABERTA';
  await query(
    `UPDATE rnc_reports
     SET status = $1::rnc_status,
         closed_at = CASE WHEN $1 = 'ENCERRADA' THEN NOW() ELSE closed_at END,
         closed_by = CASE WHEN $1 = 'ENCERRADA' THEN $2 ELSE closed_by END,
         reopened_at = CASE WHEN $1 = 'REABERTA' THEN NOW() ELSE reopened_at END,
         reopened_by = CASE WHEN $1 = 'REABERTA' THEN $2 ELSE reopened_by END,
         updated_by = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [nextStatus, req.user.id, id]
  );

  await appendHistory(id, 'EFICACIA', 'Revisao de eficacia registrada.', req.user.id, {
    effectiveness_result,
    follow_up_required: !!follow_up_required,
    next_status: nextStatus,
  });

  res.json(result.rows[0]);
}

async function closeRnc(req, res) {
  if (!canManageRnc(req.user)) {
    return res.status(403).json({ error: 'Apenas ADMIN/QUALIDADE podem encerrar RNC.' });
  }

  const { id } = req.params;
  const { conclusion_summary } = req.body;

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  const result = await query(
    `UPDATE rnc_reports
     SET status = 'ENCERRADA',
         conclusion_summary = COALESCE($1, conclusion_summary),
         closed_at = NOW(),
         closed_by = $2,
         updated_by = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [conclusion_summary || null, req.user.id, id]
  );

  await appendHistory(id, 'ENCERRAMENTO', 'RNC encerrada.', req.user.id, {
    conclusion_summary: conclusion_summary || null,
  });

  res.json(result.rows[0]);
}

async function reopenRnc(req, res) {
  if (!canManageRnc(req.user)) {
    return res.status(403).json({ error: 'Apenas ADMIN/QUALIDADE podem reabrir RNC.' });
  }

  const { id } = req.params;
  const { reason } = req.body;

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  const result = await query(
    `UPDATE rnc_reports
     SET status = 'REABERTA',
         reopened_at = NOW(),
         reopened_by = $1,
         updated_by = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [req.user.id, id]
  );

  await appendHistory(id, 'REABERTURA', 'RNC reaberta.', req.user.id, {
    reason: reason || null,
  });

  res.json(result.rows[0]);
}

async function addComment(req, res) {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'comment e obrigatorio.' });
  }

  const rnc = await getRncByIdRaw(id);
  if (!rnc) {
    return res.status(404).json({ error: 'RNC nao encontrada.' });
  }

  assertAccess(rnc, req.user);

  await appendHistory(id, 'COMENTARIO', comment.trim(), req.user.id);
  res.status(201).json({ message: 'Comentario registrado.' });
}

function uploadAttachment(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const rnc = await getRncByIdRaw(req.params.id);
    if (!rnc) {
      return res.status(404).json({ error: 'RNC nao encontrada.' });
    }

    assertAccess(rnc, req.user);

    const dir = path.join(__dirname, '..', '..', 'uploads', 'rnc', req.params.id);
    fs.mkdirSync(dir, { recursive: true });

    const safeName = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fullPath = path.join(dir, safeName);
    fs.writeFileSync(fullPath, req.file.buffer);

    const relative = `/unificado/ged/uploads/rnc/${req.params.id}/${safeName}`;

    const result = await query(
      `INSERT INTO rnc_attachments (rnc_id, file_name, original_name, mime_type, file_size, storage_path, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.params.id, safeName, req.file.originalname, req.file.mimetype, req.file.size, relative, req.user.id]
    );

    await appendHistory(req.params.id, 'ANEXO', `Anexo incluido: ${req.file.originalname}`, req.user.id, {
      attachment_id: result.rows[0].id,
      storage_path: relative,
    });

    res.status(201).json(result.rows[0]);
  });
}

module.exports = {
  listUsers,
  list,
  getById,
  create,
  triage,
  updateStatus,
  upsertRootCause,
  addAction,
  updateAction,
  reviewEffectiveness,
  closeRnc,
  reopenRnc,
  addComment,
  uploadAttachment,
};
