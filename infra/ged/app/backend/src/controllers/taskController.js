const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { query } = require('../config/database');

const STATUSES = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIROS', 'CONCLUIDA', 'CANCELADA'];
const PRIORITIES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const AREAS = [
  'LABORATORIO', 'QUALIDADE', 'PRODUCAO', 'ENGENHARIA', 'ADMINISTRATIVO', 'SEGURANCA',
  'AEE', 'COM', 'CQC', 'INJ', 'MAN', 'PCP', 'PJT', 'PRO', 'REC', 'RHU', 'SGA', 'SGQ', 'SST', 'VEN',
];

const TASK_UPLOAD_DIR = path.join(__dirname, '../../uploads/tasks');
fs.mkdirSync(TASK_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TASK_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  // Exact 25 MiB must pass; Busboy rejects when size reaches its cap.
  limits: { fileSize: 25 * 1024 * 1024 + 1 },
}).single('file');

function canSeeAll(user) {
  return ['ADMIN', 'ADMIN_MASTER', 'QUALIDADE'].includes(user.role);
}

function canCreateTask(user) {
  return ['ADMIN', 'ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO'].includes(user.role);
}

function ownsArea(user, department) {
  return !!user.managed_area && !!department && user.managed_area === department;
}

function hasTaskAccess(task, user) {
  if (canSeeAll(user)) return true;
  if (task.created_by === user.id || task.responsible_id === user.id) return true;
  if (ownsArea(user, task.department)) return true;
  if (task.is_participant) return true;
  return false;
}

function canManageTask(task, user) {
  if (canSeeAll(user)) return true;
  if (task.created_by === user.id) return true;
  if (ownsArea(user, task.department)) return true;
  return false;
}

function assertValidEnum(value, valid, field) {
  if (value && !valid.includes(value)) {
    const err = new Error(`${field} inválido.`);
    err.status = 400;
    throw err;
  }
}

async function appendHistory(taskId, eventType, description, userId, metadata = {}) {
  await query(
    `INSERT INTO task_history (task_id, event_type, description, metadata, created_by)
     VALUES ($1, $2::task_history_type, $3, $4::jsonb, $5)`,
    [taskId, eventType, description, JSON.stringify(metadata || {}), userId || null]
  );
}

async function getTaskRaw(id, userId) {
  const result = await query(
    `SELECT
       t.*,
       cu.name AS created_by_name,
       ru.name AS responsible_name,
       ru.email AS responsible_email,
       EXISTS (
         SELECT 1 FROM task_participants tp
         WHERE tp.task_id = t.id AND tp.user_id = $2
       ) AS is_participant
     FROM tasks t
     JOIN users cu ON cu.id = t.created_by
     LEFT JOIN users ru ON ru.id = t.responsible_id
     WHERE t.id = $1`,
    [id, userId]
  );
  return result.rows[0] || null;
}

function accessWhere(user, params, idxRef, alias = 't') {
  if (canSeeAll(user)) return '';

  const userIdx = idxRef.value++;
  params.push(user.id);
  const areaIdx = idxRef.value++;
  params.push(user.managed_area || null);

  return ` AND (
    ${alias}.created_by = $${userIdx}
    OR ${alias}.responsible_id = $${userIdx}
    OR EXISTS (
      SELECT 1 FROM task_participants tp_access
      WHERE tp_access.task_id = ${alias}.id AND tp_access.user_id = $${userIdx}
    )
    OR ($${areaIdx}::text IS NOT NULL AND ${alias}.department::text = $${areaIdx}::text)
  )`;
}

function mapTask(row) {
  const due = row.due_date ? new Date(row.due_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    ...row,
    overdue: !!due && !['CONCLUIDA', 'CANCELADA'].includes(row.status) && due < today,
  };
}

function buildAccess(user, baseParams = []) {
  const params = [...baseParams];
  const idxRef = { value: params.length + 1 };
  const access = accessWhere(user, params, idxRef);
  return { params, access, next: idxRef.value };
}

async function listUsers(req, res) {
  const result = await query(
    `SELECT id, name, email, role, managed_area, active
     FROM users
     WHERE active = TRUE
       AND company_id IS NOT DISTINCT FROM COALESCE($1, (SELECT company_id FROM users WHERE id = $2))
     ORDER BY name`,
    [req.user.company_id || null, req.user.id]
  );
  res.json(result.rows);
}

async function dashboard(req, res) {
  const summaryScope = buildAccess(req.user, [req.user.company_id]);
  const responsibleScope = buildAccess(req.user, [req.user.company_id]);
  const statusScope = buildAccess(req.user, [req.user.company_id]);
  const priorityScope = buildAccess(req.user, [req.user.company_id]);
  const dueSoonScope = buildAccess(req.user, [req.user.company_id]);
  const mineScope = buildAccess(req.user, [req.user.company_id]);

  const [summary, byResponsible, byStatus, byPriority, dueSoon, mine] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status NOT IN ('CONCLUIDA', 'CANCELADA'))::int AS open_total,
         COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('CONCLUIDA', 'CANCELADA'))::int AS overdue_total,
         COUNT(*) FILTER (
           WHERE status = 'CONCLUIDA'
           AND completed_at >= DATE_TRUNC('month', NOW())
           AND completed_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
         )::int AS completed_month,
         COUNT(*) FILTER (WHERE responsible_id = $${summaryScope.next} AND status NOT IN ('CONCLUIDA', 'CANCELADA'))::int AS my_pending
       FROM tasks t
       WHERE t.company_id = $1 ${summaryScope.access}`,
      [...summaryScope.params, req.user.id]
    ),
    query(
      `SELECT COALESCE(u.name, 'Sem responsável') AS label, COUNT(*)::int AS count
       FROM tasks t
       LEFT JOIN users u ON u.id = t.responsible_id
       WHERE t.company_id = $1 AND t.status NOT IN ('CONCLUIDA', 'CANCELADA') ${responsibleScope.access}
       GROUP BY u.name
       ORDER BY count DESC, label
       LIMIT 8`,
      responsibleScope.params
    ),
    query(
      `SELECT status AS label, COUNT(*)::int AS count
       FROM tasks t
       WHERE t.company_id = $1 ${statusScope.access}
       GROUP BY status
       ORDER BY status`,
      statusScope.params
    ),
    query(
      `SELECT priority AS label, COUNT(*)::int AS count
       FROM tasks t
       WHERE t.company_id = $1 ${priorityScope.access}
       GROUP BY priority
       ORDER BY priority`,
      priorityScope.params
    ),
    query(
      `SELECT t.id, t.title, t.priority, t.status, t.due_date, u.name AS responsible_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.responsible_id
       WHERE t.company_id = $1
         AND t.status NOT IN ('CONCLUIDA', 'CANCELADA')
         AND t.due_date IS NOT NULL
         ${dueSoonScope.access}
       ORDER BY t.due_date ASC
       LIMIT 8`,
      dueSoonScope.params
    ),
    query(
      `SELECT t.id, t.title, t.priority, t.status, t.due_date, u.name AS responsible_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.responsible_id
       WHERE t.company_id = $1
         AND t.status NOT IN ('CONCLUIDA', 'CANCELADA')
         AND (t.responsible_id = $${mineScope.next}
           OR EXISTS (SELECT 1 FROM task_participants tp WHERE tp.task_id = t.id AND tp.user_id = $${mineScope.next}))
         ${mineScope.access}
       ORDER BY t.due_date ASC NULLS LAST, t.updated_at DESC
       LIMIT 8`,
      [...mineScope.params, req.user.id]
    ),
  ]);

  res.json({
    summary: summary.rows[0],
    by_responsible: byResponsible.rows,
    by_status: byStatus.rows,
    by_priority: byPriority.rows,
    due_soon: dueSoon.rows.map(mapTask),
    mine: mine.rows.map(mapTask),
  });
}

async function list(req, res) {
  const {
    status,
    priority,
    responsible_id,
    department,
    created_from,
    created_to,
    due_from,
    due_to,
    document_id,
    overdue,
    mine,
    search,
  } = req.query;

  assertValidEnum(status, STATUSES, 'status');
  assertValidEnum(priority, PRIORITIES, 'priority');
  assertValidEnum(department, AREAS, 'department');

  const params = [req.user.company_id];
  const conditions = ['t.company_id = $1'];
  const idxRef = { value: 2 };

  if (status) { conditions.push(`t.status = $${idxRef.value++}::task_status`); params.push(status); }
  if (priority) { conditions.push(`t.priority = $${idxRef.value++}::task_priority`); params.push(priority); }
  if (responsible_id) { conditions.push(`t.responsible_id = $${idxRef.value++}`); params.push(responsible_id); }
  if (department) { conditions.push(`t.department = $${idxRef.value++}`); params.push(department); }
  if (created_from) { conditions.push(`t.created_at::date >= $${idxRef.value++}`); params.push(created_from); }
  if (created_to) { conditions.push(`t.created_at::date <= $${idxRef.value++}`); params.push(created_to); }
  if (due_from) { conditions.push(`t.due_date >= $${idxRef.value++}`); params.push(due_from); }
  if (due_to) { conditions.push(`t.due_date <= $${idxRef.value++}`); params.push(due_to); }
  if (document_id) {
    conditions.push(`EXISTS (SELECT 1 FROM task_document_links tdl WHERE tdl.task_id = t.id AND tdl.document_id = $${idxRef.value++})`);
    params.push(document_id);
  }
  if (overdue === 'true') {
    conditions.push(`t.due_date < CURRENT_DATE AND t.status NOT IN ('CONCLUIDA', 'CANCELADA')`);
  }
  if (mine === 'true') {
    conditions.push(`(t.responsible_id = $${idxRef.value} OR EXISTS (SELECT 1 FROM task_participants tp_mine WHERE tp_mine.task_id = t.id AND tp_mine.user_id = $${idxRef.value}))`);
    params.push(req.user.id);
    idxRef.value += 1;
  }
  if (search) {
    conditions.push(`(t.title ILIKE $${idxRef.value} OR t.description ILIKE $${idxRef.value} OR t.observations ILIKE $${idxRef.value})`);
    params.push(`%${search}%`);
    idxRef.value += 1;
  }

  const access = accessWhere(req.user, params, idxRef);

  const result = await query(
    `SELECT
       t.*,
       cu.name AS created_by_name,
       ru.name AS responsible_name,
       COUNT(DISTINCT tp.user_id)::int AS participants_count,
       COUNT(DISTINCT tdl.document_id)::int AS documents_count
     FROM tasks t
     JOIN users cu ON cu.id = t.created_by
     LEFT JOIN users ru ON ru.id = t.responsible_id
     LEFT JOIN task_participants tp ON tp.task_id = t.id
     LEFT JOIN task_document_links tdl ON tdl.task_id = t.id
     WHERE ${conditions.join(' AND ')} ${access}
     GROUP BY t.id, cu.name, ru.name
     ORDER BY
       CASE t.priority WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 ELSE 4 END,
       t.due_date ASC NULLS LAST,
       t.updated_at DESC`,
    params
  );

  res.json(result.rows.map(mapTask));
}

async function getById(req, res) {
  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) {
    return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  }
  if (!hasTaskAccess(task, req.user)) {
    return res.status(403).json({ error: 'Sem permissão para acessar esta tarefa.' });
  }

  const [participants, comments, history, documents, attachments] = await Promise.all([
    query(
      `SELECT tp.*, u.name, u.email, u.role, u.managed_area
       FROM task_participants tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.task_id = $1
       ORDER BY u.name`,
      [task.id]
    ),
    query(
      `SELECT c.*, u.name AS created_by_name
       FROM task_comments c
       JOIN users u ON u.id = c.created_by
       WHERE c.task_id = $1
       ORDER BY c.created_at DESC`,
      [task.id]
    ),
    query(
      `SELECT h.*, u.name AS created_by_name
       FROM task_history h
       LEFT JOIN users u ON u.id = h.created_by
       WHERE h.task_id = $1
       ORDER BY h.created_at DESC`,
      [task.id]
    ),
    query(
      `SELECT tdl.*, d.code, d.name, d.area, d.status, d.current_revision, v.drive_web_url AS current_file_url
       FROM task_document_links tdl
       JOIN documents d ON d.id = tdl.document_id
       LEFT JOIN versions v ON v.id = d.current_version_id
       WHERE tdl.task_id = $1
       ORDER BY tdl.created_at DESC`,
      [task.id]
    ),
    query(
      `SELECT a.*, u.name AS uploaded_by_name
       FROM task_attachments a
       JOIN users u ON u.id = a.uploaded_by
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [task.id]
    ),
  ]);

  res.json({
    task: mapTask(task),
    participants: participants.rows,
    comments: comments.rows,
    history: history.rows,
    documents: documents.rows,
    attachments: attachments.rows,
  });
}

async function create(req, res) {
  if (!canCreateTask(req.user)) {
    return res.status(403).json({ error: 'Sem permissão para criar tarefas.' });
  }

  const {
    title,
    description,
    responsible_id,
    department,
    priority,
    status,
    due_date,
    observations,
    participant_ids,
    document_id,
  } = req.body;

  if (!title || !title.trim() || !responsible_id || !department) {
    return res.status(400).json({ error: 'title, responsible_id e department sao obrigatorios.' });
  }
  assertValidEnum(priority || 'MEDIA', PRIORITIES, 'priority');
  assertValidEnum(status || 'ABERTA', STATUSES, 'status');
  assertValidEnum(department, AREAS, 'department');

  if (!canSeeAll(req.user) && !ownsArea(req.user, department)) {
    return res.status(403).json({ error: 'Sem permissão para criar tarefa neste setor.' });
  }

  const responsible = await query(
    `SELECT id FROM users WHERE id = $1 AND active = TRUE AND company_id = $2`,
    [responsible_id, req.user.company_id]
  );
  if (!responsible.rows.length) {
    return res.status(400).json({ error: 'Responsável inválido.' });
  }

  if (document_id) {
    const doc = await query(`SELECT id FROM documents WHERE id = $1 AND company_id = $2`, [document_id, req.user.company_id]);
    if (!doc.rows.length) return res.status(400).json({ error: 'Documento vinculado inválido.' });
  }

  const result = await query(
    `INSERT INTO tasks (
       company_id, title, description, responsible_id, created_by,
       department, priority, status, due_date, completed_at, observations
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::task_priority, $8::task_status, $9,
       CASE WHEN $8::task_status = 'CONCLUIDA' THEN NOW() ELSE NULL END,
       $10
     )
     RETURNING *`,
    [
      req.user.company_id,
      title.trim(),
      description || null,
      responsible_id,
      req.user.id,
      department,
      priority || 'MEDIA',
      status || 'ABERTA',
      due_date || null,
      observations || null,
    ]
  );

  const task = result.rows[0];
  await appendHistory(task.id, 'CRIACAO', 'Tarefa criada.', req.user.id, {
    responsible_id,
    department,
    priority: priority || 'MEDIA',
    status: status || 'ABERTA',
    due_date: due_date || null,
  });

  const participants = Array.isArray(participant_ids) ? participant_ids.filter(Boolean) : [];
  for (const userId of participants) {
    await query(
      `INSERT INTO task_participants (task_id, user_id, added_by)
       SELECT $1, u.id, $3 FROM users u
       WHERE u.id = $2 AND u.company_id = $4 AND u.active = TRUE
       ON CONFLICT DO NOTHING`,
      [task.id, userId, req.user.id, req.user.company_id]
    );
  }

  if (document_id) {
    await query(
      `INSERT INTO task_document_links (task_id, document_id, linked_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [task.id, document_id, req.user.id]
    );
    await appendHistory(task.id, 'DOCUMENTO', 'Documento vinculado a tarefa.', req.user.id, { document_id });
  }

  res.status(201).json(task);
}

async function update(req, res) {
  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) {
    return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  }
  if (!canManageTask(task, req.user)) {
    return res.status(403).json({ error: 'Sem permissão para editar esta tarefa.' });
  }

  const { title, description, department, priority, due_date, observations } = req.body;
  assertValidEnum(priority, PRIORITIES, 'priority');
  assertValidEnum(department, AREAS, 'department');

  if (department && !canSeeAll(req.user) && !ownsArea(req.user, department)) {
    return res.status(403).json({ error: 'Sem permissão para mover tarefa para este setor.' });
  }

  const result = await query(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         department = COALESCE($3, department),
         priority = COALESCE($4::task_priority, priority),
         due_date = $5,
         observations = COALESCE($6, observations)
     WHERE id = $7 AND company_id = $8
     RETURNING *`,
    [
      title ? title.trim() : null,
      description ?? null,
      department || null,
      priority || null,
      due_date === undefined ? task.due_date : (due_date || null),
      observations ?? null,
      task.id,
      req.user.company_id,
    ]
  );

  if (due_date !== undefined && String(task.due_date || '') !== String(due_date || '')) {
    await appendHistory(task.id, 'PRAZO', 'Prazo alterado.', req.user.id, {
      previous_due_date: task.due_date,
      next_due_date: due_date || null,
    });
  }
  await appendHistory(task.id, 'EDICAO', 'Dados da tarefa atualizados.', req.user.id);

  res.json(result.rows[0]);
}

async function updateStatus(req, res) {
  const { status, notes } = req.body;
  assertValidEnum(status, STATUSES, 'status');
  if (!status) return res.status(400).json({ error: 'status e obrigatorio.' });

  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!hasTaskAccess(task, req.user)) return res.status(403).json({ error: 'Sem permissão para atualizar esta tarefa.' });

  const result = await query(
    `UPDATE tasks
     SET status = $1::task_status,
         completed_at = CASE WHEN $1::task_status = 'CONCLUIDA' THEN COALESCE(completed_at, NOW()) ELSE NULL END
     WHERE id = $2 AND company_id = $3
     RETURNING *`,
    [status, task.id, req.user.company_id]
  );

  await appendHistory(
    task.id,
    status === 'CONCLUIDA' ? 'CONCLUSAO' : status === 'CANCELADA' ? 'CANCELAMENTO' : 'STATUS',
    `Status alterado para ${status}.`,
    req.user.id,
    { previous_status: task.status, next_status: status, notes: notes || null }
  );

  res.json(result.rows[0]);
}

async function updateResponsible(req, res) {
  const { responsible_id } = req.body;
  if (!responsible_id) return res.status(400).json({ error: 'responsible_id e obrigatorio.' });

  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!canManageTask(task, req.user)) return res.status(403).json({ error: 'Sem permissão para trocar responsável.' });

  const responsible = await query(
    `SELECT id FROM users WHERE id = $1 AND active = TRUE AND company_id = $2`,
    [responsible_id, req.user.company_id]
  );
  if (!responsible.rows.length) return res.status(400).json({ error: 'Responsável inválido.' });

  const result = await query(
    `UPDATE tasks SET responsible_id = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [responsible_id, task.id, req.user.company_id]
  );

  await appendHistory(task.id, 'RESPONSAVEL', 'Responsável alterado.', req.user.id, {
    previous_responsible_id: task.responsible_id,
    next_responsible_id: responsible_id,
  });

  res.json(result.rows[0]);
}

async function updateDueDate(req, res) {
  const { due_date } = req.body;
  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!canManageTask(task, req.user)) return res.status(403).json({ error: 'Sem permissão para alterar prazo.' });

  const result = await query(
    `UPDATE tasks SET due_date = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [due_date || null, task.id, req.user.company_id]
  );

  await appendHistory(task.id, 'PRAZO', 'Prazo alterado.', req.user.id, {
    previous_due_date: task.due_date,
    next_due_date: due_date || null,
  });

  res.json(result.rows[0]);
}

async function addComment(req, res) {
  const { comment } = req.body;
  if (!comment || !comment.trim()) return res.status(400).json({ error: 'comment e obrigatorio.' });

  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!hasTaskAccess(task, req.user)) return res.status(403).json({ error: 'Sem permissão para comentar.' });

  const result = await query(
    `INSERT INTO task_comments (task_id, comment, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [task.id, comment.trim(), req.user.id]
  );

  await appendHistory(task.id, 'COMENTARIO', 'Comentario adicionado.', req.user.id, { comment_id: result.rows[0].id });
  res.status(201).json(result.rows[0]);
}

async function addParticipant(req, res) {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id e obrigatorio.' });

  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!canManageTask(task, req.user)) return res.status(403).json({ error: 'Sem permissão para adicionar participante.' });

  const result = await query(
    `INSERT INTO task_participants (task_id, user_id, added_by)
     SELECT $1, u.id, $3 FROM users u
     WHERE u.id = $2 AND u.company_id = $4 AND u.active = TRUE
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [task.id, user_id, req.user.id, req.user.company_id]
  );

  await appendHistory(task.id, 'PARTICIPANTE', 'Participante adicionado.', req.user.id, { user_id });
  res.status(201).json(result.rows[0] || { task_id: task.id, user_id });
}

async function removeParticipant(req, res) {
  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!canManageTask(task, req.user)) return res.status(403).json({ error: 'Sem permissão para remover participante.' });

  await query(`DELETE FROM task_participants WHERE task_id = $1 AND user_id = $2`, [task.id, req.params.userId]);
  await appendHistory(task.id, 'PARTICIPANTE', 'Participante removido.', req.user.id, { user_id: req.params.userId });
  res.json({ message: 'Participante removido.' });
}

async function linkDocument(req, res) {
  const { document_id } = req.body;
  if (!document_id) return res.status(400).json({ error: 'document_id e obrigatorio.' });

  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!canManageTask(task, req.user)) return res.status(403).json({ error: 'Sem permissão para vincular documento.' });

  const doc = await query(`SELECT id FROM documents WHERE id = $1 AND company_id = $2`, [document_id, req.user.company_id]);
  if (!doc.rows.length) return res.status(400).json({ error: 'Documento inválido.' });

  const result = await query(
    `INSERT INTO task_document_links (task_id, document_id, linked_by)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [task.id, document_id, req.user.id]
  );

  await appendHistory(task.id, 'DOCUMENTO', 'Documento vinculado a tarefa.', req.user.id, { document_id });
  res.status(201).json(result.rows[0] || { task_id: task.id, document_id });
}

async function unlinkDocument(req, res) {
  const task = await getTaskRaw(req.params.id, req.user.id);
  if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!canManageTask(task, req.user)) return res.status(403).json({ error: 'Sem permissão para desvincular documento.' });

  await query(`DELETE FROM task_document_links WHERE task_id = $1 AND document_id = $2`, [task.id, req.params.documentId]);
  await appendHistory(task.id, 'DOCUMENTO', 'Documento desvinculado da tarefa.', req.user.id, { document_id: req.params.documentId });
  res.json({ message: 'Documento desvinculado.' });
}

async function uploadAttachment(req, res) {
  // Reject inaccessible tasks before Multer writes anything to disk.
  const preflightTask = await getTaskRaw(req.params.id, req.user.id);
  if (!preflightTask || preflightTask.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
  if (!hasTaskAccess(preflightTask, req.user)) return res.status(403).json({ error: 'Sem permissao para anexar arquivo.' });
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo e obrigatorio.' });

    const task = await getTaskRaw(req.params.id, req.user.id);
    if (!task || task.company_id !== req.user.company_id) return res.status(404).json({ error: 'Tarefa nao encontrada.' });
    if (!hasTaskAccess(task, req.user)) return res.status(403).json({ error: 'Sem permissão para anexar arquivo.' });

    const storagePath = `/unificado/ged/uploads/tasks/${req.file.filename}`;
    const result = await query(
      `INSERT INTO task_attachments (task_id, file_name, original_name, mime_type, file_size, storage_path, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [task.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, storagePath, req.user.id]
    );

    await appendHistory(task.id, 'ANEXO', 'Anexo adicionado.', req.user.id, { attachment_id: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  });
}

async function cancel(req, res) {
  req.body.status = 'CANCELADA';
  return updateStatus(req, res);
}

module.exports = {
  listUsers,
  dashboard,
  list,
  getById,
  create,
  update,
  updateStatus,
  updateResponsible,
  updateDueDate,
  addComment,
  addParticipant,
  removeParticipant,
  linkDocument,
  unlinkDocument,
  uploadAttachment,
  cancel,
};
