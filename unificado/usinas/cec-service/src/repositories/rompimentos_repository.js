const database = require('../core/database');

function buildFilters(filters) {
  const clauses = [];
  const values = [];

  function add(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (filters.ano) {
    clauses.push(`extract(year from data_moldagem) = ${add(filters.ano)}`);
  }
  if (filters.mes) {
    clauses.push(`extract(month from data_moldagem) = ${add(filters.mes)}`);
  }
  if (filters.data_inicio) {
    clauses.push(`data_moldagem >= ${add(filters.data_inicio)}::date`);
  }
  if (filters.data_fim) {
    clauses.push(`data_moldagem <= ${add(filters.data_fim)}::date`);
  }

  return {
    where: clauses.length ? `where ${clauses.join(' and ')}` : '',
    values,
  };
}

async function listRompimentos(filters) {
  const built = buildFilters(filters);
  const limitParam = `$${built.values.length + 1}`;
  const offsetParam = `$${built.values.length + 2}`;
  const params = built.values.concat([filters.limit + 1, filters.offset]);

  const sql = `
    select data_moldagem, data_ruptura, traco_id, idade_dias, cp, mpa, updated_at, created_a
    from (
      select distinct on (data_moldagem, traco_id, idade_dias, cp)
        data_moldagem, data_ruptura, traco_id, idade_dias, cp, mpa, updated_at, created_a
      from rompimentos
      ${built.where}
      order by data_moldagem, traco_id, idade_dias, cp, updated_at desc, created_at desc
    ) dedup
    order by data_moldagem desc nulls last, traco_id asc, idade_dias asc, cp asc
    limit ${limitParam}
    offset ${offsetParam}
  `;

  const result = await database.query(sql, params);
  return result.rows;
}

async function saveRompimentoTx(record) {
  const client = await database.pool.connect();
  const payloadJson = JSON.stringify(record.payload_json || {});
  const recordValues = [
    record.id, record.source, record.etiqueta_id, record.traco_id, record.idade_dias, record.cp,
    record.data_moldagem, record.hora_moldagem, record.data_ruptura, record.mpa,
    record.status_meta, record.meta_min, record.meta_max, record.responsavel,
    record.qr_raw, payloadJson, record.client_created_a
  ];
  try {
    await client.query('BEGIN');

    // Replays with the same id and payload are successful no-ops. This keeps
    // offline retries and legacy synchronizers from generating audit floods.
    const duplicate = await client.query(
      `SELECT id, created_at, updated_a
       FROM rompimentos
       WHERE id = $1
         AND source IS NOT DISTINCT FROM $2
         AND etiqueta_id IS NOT DISTINCT FROM $3
         AND traco_id IS NOT DISTINCT FROM $4
         AND idade_dias IS NOT DISTINCT FROM $5
         AND cp IS NOT DISTINCT FROM $6
         AND data_moldagem IS NOT DISTINCT FROM $7::date
         AND hora_moldagem IS NOT DISTINCT FROM $8
         AND data_ruptura IS NOT DISTINCT FROM $9::date
         AND mpa IS NOT DISTINCT FROM $10
         AND status_meta IS NOT DISTINCT FROM $11
         AND meta_min IS NOT DISTINCT FROM $12
         AND meta_max IS NOT DISTINCT FROM $13
         AND responsavel IS NOT DISTINCT FROM $14
         AND qr_raw IS NOT DISTINCT FROM $15
         AND payload_json IS NOT DISTINCT FROM $16::jsonb
         AND client_created_at IS NOT DISTINCT FROM $17::timestamptz`,
      recordValues
    );
    if (duplicate.rowCount > 0) {
      await client.query('COMMIT');
      return Object.assign({}, duplicate.rows[0], { unchanged: true });
    }

    // 1. Determine event type (INSERT or UPDATE)
    const checkCurrent = await client.query(
      `SELECT id FROM rompimentos_atuais WHERE data_moldagem = $1 AND traco_id = $2 AND idade_dias = $3 AND cp = $4`,
      [record.data_moldagem, record.traco_id, record.idade_dias, record.cp]
    );
    const tipo_evento = checkCurrent.rowCount > 0 ? 'UPDATE' : 'INSERT';

    // 2. Legacy table write (for compatibility)
    const legacySql = `
      INSERT INTO rompimentos (
        id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_json, client_created_a
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17)
      ON CONFLICT (id) DO UPDATE SET
        source = EXCLUDED.source,
        etiqueta_id = EXCLUDED.etiqueta_id,
        traco_id = EXCLUDED.traco_id,
        idade_dias = EXCLUDED.idade_dias,
        cp = EXCLUDED.cp,
        data_moldagem = EXCLUDED.data_moldagem,
        hora_moldagem = EXCLUDED.hora_moldagem,
        data_ruptura = EXCLUDED.data_ruptura,
        mpa = EXCLUDED.mpa,
        status_meta = EXCLUDED.status_meta,
        meta_min = EXCLUDED.meta_min,
        meta_max = EXCLUDED.meta_max,
        responsavel = EXCLUDED.responsavel,
        qr_raw = EXCLUDED.qr_raw,
        payload_json = EXCLUDED.payload_json,
        client_created_at = EXCLUDED.client_created_at,
        updated_at = now()
      RETURNING id, created_at, updated_a
    `;
    const legacyRes = await client.query(legacySql, recordValues);

    // 3. Current operational state write (deduplicated key)
    const currentSql = `
      INSERT INTO rompimentos_atuais (
        id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_json, client_created_a
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17)
      ON CONFLICT (data_moldagem, traco_id, idade_dias, cp) DO UPDATE SET
        id = EXCLUDED.id,
        source = EXCLUDED.source,
        etiqueta_id = EXCLUDED.etiqueta_id,
        hora_moldagem = EXCLUDED.hora_moldagem,
        data_ruptura = EXCLUDED.data_ruptura,
        mpa = EXCLUDED.mpa,
        status_meta = EXCLUDED.status_meta,
        meta_min = EXCLUDED.meta_min,
        meta_max = EXCLUDED.meta_max,
        responsavel = EXCLUDED.responsavel,
        qr_raw = EXCLUDED.qr_raw,
        payload_json = EXCLUDED.payload_json,
        client_created_at = EXCLUDED.client_created_at,
        updated_at = now()
    `;
    await client.query(currentSql, recordValues);

    // 4. Audit events write
    const eventSql = `
      INSERT INTO rompimentos_eventos (
        rompimento_id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_original, tipo_evento, client_created_a
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18)
    `;
    await client.query(eventSql, recordValues.slice(0, 16).concat([tipo_evento, record.client_created_at]));

    // 5. De-duplicated task queue insertion
    const queueCheck = await client.query(
      `SELECT id FROM fila_recalculo
       WHERE data_moldagem = $1 AND traco_id = $2 AND idade_dias = $3 AND status = 'pendente'
       LIMIT 1`,
      [record.data_moldagem, record.traco_id, record.idade_dias]
    );
    if (queueCheck.rowCount === 0) {
      await client.query(
        `INSERT INTO fila_recalculo (data_moldagem, traco_id, idade_dias, status)
         VALUES ($1, $2, $3, 'pendente')`,
        [record.data_moldagem, record.traco_id, record.idade_dias]
      );
    }

    await client.query('COMMIT');
    return legacyRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listRompimentos, saveRompimentoTx };
