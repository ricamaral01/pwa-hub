const { pool } = require('../core/database');
const { processPendingJobs } = require('../services/analytics_service');
const { log } = require('../core/logger');

async function runBackfill() {
  log('INFO', 'backfill_started');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Populate rompimentos_eventos with baseline historical records
    log('INFO', 'backfill_populating_events');
    await client.query(`
      INSERT INTO rompimentos_eventos (
        rompimento_id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_original, tipo_evento, client_created_at, created_at
      )
      SELECT 
        id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_json, 'INSERT', client_created_at, created_at
      FROM rompimentos
      ON CONFLICT DO NOTHING
    `);

    // 2. Populate rompimentos_atuais with consolidated current states
    log('INFO', 'backfill_populating_current_state');
    await client.query(`
      INSERT INTO rompimentos_atuais (
        id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_json, client_created_at, created_at, updated_at
      )
      SELECT DISTINCT ON (data_moldagem, traco_id, idade_dias, cp)
        id, source, etiqueta_id, traco_id, idade_dias, cp,
        data_moldagem, hora_moldagem, data_ruptura, mpa,
        status_meta, meta_min, meta_max, responsavel,
        qr_raw, payload_json, client_created_at, created_at, updated_at
      FROM rompimentos
      ORDER BY data_moldagem, traco_id, idade_dias, cp, updated_at DESC, created_at DESC
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
    `);

    // 3. Populate fila_recalculo with tasks for all groups
    log('INFO', 'backfill_queuing_tasks');
    await client.query(`
      INSERT INTO fila_recalculo (data_moldagem, traco_id, idade_dias, status)
      SELECT DISTINCT r.data_moldagem, r.traco_id, r.idade_dias, 'pendente'
      FROM rompimentos_atuais r
      WHERE NOT EXISTS (
        SELECT 1 FROM fila_recalculo f
        WHERE f.data_moldagem = r.data_moldagem
          AND f.traco_id = r.traco_id
          AND f.idade_dias = r.idade_dias
          AND f.status = 'pendente'
      )
    `);

    await client.query('COMMIT');
    log('INFO', 'backfill_transaction_committed');
  } catch (err) {
    await client.query('ROLLBACK');
    log('ERROR', 'backfill_transaction_failed', { error: err.message });
    throw err;
  } finally {
    client.release();
  }

  // 4. Trigger bulk calculation processing
  log('INFO', 'backfill_processing_calculations');
  const count = await processPendingJobs();
  log('INFO', 'backfill_completed', { processed_groups_count: count });
  return count;
}

if (require.main === module) {
  runBackfill()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runBackfill };
