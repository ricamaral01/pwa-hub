const { pool } = require('../core/database');
const { log } = require('../core/logger');
const { analyticsCache } = require('../core/analytics_cache');

// Metas padrão caso não encontradas na tabela faixas_resistencia
const DEFAULT_FAIXAS = {
  1: { min: 8.00, max: 14.00 },
  3: { min: 16.00, max: 24.00 },
  7: { min: 22.00, max: 32.00 },
  28: { min: 32.00, max: 42.00 }
};

function formatDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal.toISOString().slice(0, 10);
  return String(dateVal).slice(0, 10);
}

function calculateStdDev(values) {
  const nums = (values || []).map(Number).filter(v => Number.isFinite(v));
  if (nums.length < 2) return null;
  const mean = nums.reduce((sum, v) => sum + v, 0) / nums.length;
  // Divide by length to match the legacy frontend's population standard deviation exactly
  const variance = nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / nums.length;
  const sd = Math.sqrt(variance);
  return Number.isFinite(sd) ? sd : null;
}

async function getResistanceRange(idade, client) {
  try {
    const res = await client.query(
      `SELECT valor_minimo as min, valor_maximo as max 
       FROM faixas_resistencia 
       WHERE idade_dias = $1 
       LIMIT 1`,
      [idade]
    );
    if (res.rowCount > 0) {
      return {
        min: Number(res.rows[0].min),
        max: Number(res.rows[0].max)
      };
    }
  } catch (err) {
    log('WARN', 'failed_fetch_faixas_resistencia', { error: err.message });
  }
  return DEFAULT_FAIXAS[idade] || null;
}

async function recalculateGroup(dataMoldagemRaw, tracoId, idadeDiasRaw, client) {
  const data_moldagem = formatDate(dataMoldagemRaw);
  const idade_dias = Number(idadeDiasRaw);

  // 1. Get raw current specimen rompimentos
  const rawRes = await client.query(
    `SELECT cp, mpa, data_ruptura 
     FROM rompimentos_atuais 
     WHERE data_moldagem = $1 AND traco_id = $2 AND idade_dias = $3`,
    [data_moldagem, tracoId, idade_dias]
  );
  const cps = rawRes.rows;

  let mpa_cp1 = null;
  let mpa_cp2 = null;
  let data_ruptura = null;

  cps.forEach(c => {
    const cpNum = String(c.cp).trim().replace(/^'/, '');
    const mpaVal = c.mpa !== null ? Number(c.mpa) : null;
    if (cpNum === '1') {
      mpa_cp1 = mpaVal;
      if (c.data_ruptura) data_ruptura = formatDate(c.data_ruptura);
    } else if (cpNum === '2') {
      mpa_cp2 = mpaVal;
      if (c.data_ruptura && !data_ruptura) data_ruptura = formatDate(c.data_ruptura);
    }
  });

  // Calculate consolidated media
  let media_mpa = null;
  let quantidade_cp = 0;

  if (mpa_cp1 !== null && mpa_cp2 !== null) {
    media_mpa = (mpa_cp1 + mpa_cp2) / 2;
    quantidade_cp = 2;
  } else if (mpa_cp1 !== null) {
    media_mpa = mpa_cp1;
    quantidade_cp = 1;
  } else if (mpa_cp2 !== null) {
    media_mpa = mpa_cp2;
    quantidade_cp = 1;
  }

  // Calculate status matching resistance ranges
  let status_resultado = 'PEND';
  const range = await getResistanceRange(idade_dias, client);
  let meta_minima = range ? range.min : null;
  let meta_maxima = range ? range.max : null;

  if (media_mpa !== null) {
    if (range) {
      if (media_mpa < range.min) status_resultado = 'NOK';
      else if (media_mpa > range.max) status_resultado = 'AMP';
      else status_resultado = 'OK';
    } else {
      status_resultado = 'OK'; // No range limits, default to OK
    }
  }

  // 2. UPSERT into rompimentos_grupos
  const upsertGroupSql = `
    INSERT INTO rompimentos_grupos (
      data_moldagem, traco_id, idade_dias, data_ruptura,
      mpa_cp1, mpa_cp2, media_mpa, quantidade_cp,
      status_resultado, meta_minima, meta_maxima, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
    ON CONFLICT (data_moldagem, traco_id, idade_dias) DO UPDATE SET
      data_ruptura = EXCLUDED.data_ruptura,
      mpa_cp1 = EXCLUDED.mpa_cp1,
      mpa_cp2 = EXCLUDED.mpa_cp2,
      media_mpa = EXCLUDED.media_mpa,
      quantidade_cp = EXCLUDED.quantidade_cp,
      status_resultado = EXCLUDED.status_resultado,
      meta_minima = EXCLUDED.meta_minima,
      meta_maxima = EXCLUDED.meta_maxima,
      updated_at = now()
  `;
  await client.query(upsertGroupSql, [
    data_moldagem, tracoId, idade_dias, data_ruptura,
    mpa_cp1, mpa_cp2, media_mpa !== null ? Number(media_mpa.toFixed(2)) : null,
    quantidade_cp, status_resultado, meta_minima, meta_maxima
  ]);

  // 3. Recalculate daily stats for data_moldagem (referência)
  const dailyAgg = await client.query(
    `SELECT 
       COUNT(*) as quantidade_grupos,
       COALESCE(SUM(quantidade_cp), 0) as quantidade_corpos_prova,
       COUNT(CASE WHEN status_resultado = 'OK' THEN 1 END) as quantidade_ok,
       COUNT(CASE WHEN status_resultado = 'NOK' THEN 1 END) as quantidade_nok,
       COUNT(CASE WHEN status_resultado = 'AMP' THEN 1 END) as quantidade_amp,
       AVG(media_mpa) as media_mpa,
       MIN(media_mpa) as valor_minimo,
       MAX(media_mpa) as valor_maximo,
       ARRAY_AGG(media_mpa) as medias
     FROM rompimentos_grupos
     WHERE data_moldagem = $1 AND traco_id = $2 AND idade_dias = $3 AND status_resultado != 'PEND'`,
    [data_moldagem, tracoId, idade_dias]
  );

  if (dailyAgg.rowCount > 0 && Number(dailyAgg.rows[0].quantidade_grupos) > 0) {
    const row = dailyAgg.rows[0];
    const rawMedias = (row.medias || []).filter(v => v !== null);
    const desvio = calculateStdDev(rawMedias);

    const upsertDailySql = `
      INSERT INTO estatistica_diaria (
        data_referencia, traco_id, idade_dias, quantidade_grupos,
        quantidade_corpos_prova, quantidade_ok, quantidade_nok, quantidade_amp,
        media_mpa, desvio_padrao, valor_minimo, valor_maximo, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (data_referencia, traco_id, idade_dias) DO UPDATE SET
        quantidade_grupos = EXCLUDED.quantidade_grupos,
        quantidade_corpos_prova = EXCLUDED.quantidade_corpos_prova,
        quantidade_ok = EXCLUDED.quantidade_ok,
        quantidade_nok = EXCLUDED.quantidade_nok,
        quantidade_amp = EXCLUDED.quantidade_amp,
        media_mpa = EXCLUDED.media_mpa,
        desvio_padrao = EXCLUDED.desvio_padrao,
        valor_minimo = EXCLUDED.valor_minimo,
        valor_maximo = EXCLUDED.valor_maximo,
        updated_at = now()
    `;
    await client.query(upsertDailySql, [
      data_moldagem, tracoId, idade_dias,
      Number(row.quantidade_grupos), Number(row.quantidade_corpos_prova),
      Number(row.quantidade_ok), Number(row.quantidade_nok), Number(row.quantidade_amp),
      row.media_mpa !== null ? Number(Number(row.media_mpa).toFixed(2)) : null,
      desvio !== null ? Number(desvio.toFixed(2)) : null,
      row.valor_minimo !== null ? Number(row.valor_minimo) : null,
      row.valor_maximo !== null ? Number(row.valor_maximo) : null
    ]);
  } else {
    // Clean up daily stats if no groups left
    await client.query(
      `DELETE FROM estatistica_diaria 
       WHERE data_referencia = $1 AND traco_id = $2 AND idade_dias = $3`,
      [data_moldagem, tracoId, idade_dias]
    );
  }

  // 4. Recalculate monthly stats for the month of data_moldagem
  const ano_mes = data_moldagem.slice(0, 7); // YYYY-MM
  const monthlyAgg = await client.query(
    `SELECT 
       COUNT(*) as quantidade_grupos,
       COALESCE(SUM(quantidade_cp), 0) as quantidade_corpos_prova,
       COUNT(CASE WHEN status_resultado = 'OK' THEN 1 END) as quantidade_ok,
       COUNT(CASE WHEN status_resultado = 'NOK' THEN 1 END) as quantidade_nok,
       COUNT(CASE WHEN status_resultado = 'AMP' THEN 1 END) as quantidade_amp,
       AVG(media_mpa) as media_mpa,
       MIN(media_mpa) as valor_minimo,
       MAX(media_mpa) as valor_maximo,
       ARRAY_AGG(media_mpa) as medias
     FROM rompimentos_grupos
     WHERE to_char(data_moldagem, 'YYYY-MM') = $1 AND traco_id = $2 AND idade_dias = $3 AND status_resultado != 'PEND'`,
    [ano_mes, tracoId, idade_dias]
  );

  if (monthlyAgg.rowCount > 0 && Number(monthlyAgg.rows[0].quantidade_grupos) > 0) {
    const row = monthlyAgg.rows[0];
    const rawMedias = (row.medias || []).filter(v => v !== null);
    const desvio = calculateStdDev(rawMedias);

    const upsertMonthlySql = `
      INSERT INTO estatistica_mensal (
        ano_mes, traco_id, idade_dias, quantidade_grupos,
        quantidade_corpos_prova, quantidade_ok, quantidade_nok, quantidade_amp,
        media_mpa, desvio_padrao, valor_minimo, valor_maximo, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (ano_mes, traco_id, idade_dias) DO UPDATE SET
        quantidade_grupos = EXCLUDED.quantidade_grupos,
        quantidade_corpos_prova = EXCLUDED.quantidade_corpos_prova,
        quantidade_ok = EXCLUDED.quantidade_ok,
        quantidade_nok = EXCLUDED.quantidade_nok,
        quantidade_amp = EXCLUDED.quantidade_amp,
        media_mpa = EXCLUDED.media_mpa,
        desvio_padrao = EXCLUDED.desvio_padrao,
        valor_minimo = EXCLUDED.valor_minimo,
        valor_maximo = EXCLUDED.valor_maximo,
        updated_at = now()
    `;
    await client.query(upsertMonthlySql, [
      ano_mes, tracoId, idade_dias,
      Number(row.quantidade_grupos), Number(row.quantidade_corpos_prova),
      Number(row.quantidade_ok), Number(row.quantidade_nok), Number(row.quantidade_amp),
      row.media_mpa !== null ? Number(Number(row.media_mpa).toFixed(2)) : null,
      desvio !== null ? Number(desvio.toFixed(2)) : null,
      row.valor_minimo !== null ? Number(row.valor_minimo) : null,
      row.valor_maximo !== null ? Number(row.valor_maximo) : null
    ]);
  } else {
    // Clean up monthly stats if no groups left
    await client.query(
      `DELETE FROM estatistica_mensal 
       WHERE ano_mes = $1 AND traco_id = $2 AND idade_dias = $3`,
      [ano_mes, tracoId, idade_dias]
    );
  }
}

async function processQueueOne() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch next pending job (concurrency-safe SKIP LOCKED)
    const jobRes = await client.query(
      `SELECT id, data_moldagem, traco_id, idade_dias 
       FROM fila_recalculo 
       WHERE status = 'pendente' 
       ORDER BY created_at ASC 
       LIMIT 1 
       FOR UPDATE SKIP LOCKED`
    );

    if (jobRes.rowCount === 0) {
      await client.query('COMMIT');
      return false; // No jobs processed
    }

    const job = jobRes.rows[0];

    // 2. Mark job as processing
    await client.query(
      `UPDATE fila_recalculo 
       SET status = 'processando', started_at = now(), tentativas = tentativas + 1 
       WHERE id = $1`,
      [job.id]
    );

    try {
      // 3. Process recalculation
      await recalculateGroup(job.data_moldagem, job.traco_id, job.idade_dias, client);

      // 4. Mark job as completed
      await client.query(
        `UPDATE fila_recalculo 
         SET status = 'concluido', processed_at = now(), erro = NULL 
         WHERE id = $1`,
        [job.id]
      );

      // 5. Invalidate matching cache entries for this month-year
      const jobMonthYear = formatDate(job.data_moldagem).slice(0, 7);
      analyticsCache.invalidateForMonth(jobMonthYear);
    } catch (err) {
      log('ERROR', 'analytics_group_recalculation_failed', {
        job_id: job.id,
        data_moldagem: job.data_moldagem,
        traco_id: job.traco_id,
        idade_dias: job.idade_dias,
        error: err.message
      });
      // Mark job as failed
      await client.query(
        `UPDATE fila_recalculo 
         SET status = 'erro', erro = $1 
         WHERE id = $2`,
        [err.message, job.id]
      );
    }

    await client.query('COMMIT');
    return true; // Successfully processed a job (even if it errored out internally, the transaction committed its status)
  } catch (err) {
    await client.query('ROLLBACK');
    log('ERROR', 'analytics_queue_transaction_failed', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

async function processPendingJobs() {
  let count = 0;
  try {
    let hasMore = true;
    while (hasMore) {
      const processed = await processQueueOne();
      if (processed) count++;
      else hasMore = false;
    }
  } catch (err) {
    log('ERROR', 'analytics_bulk_processing_failed', { error: err.message });
  }
  return count;
}

module.exports = {
  recalculateGroup,
  processQueueOne,
  processPendingJobs,
  calculateStdDev
};
