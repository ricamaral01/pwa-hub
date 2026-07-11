require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const app = express();
const port = Number(process.env.PORT || 3086);
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'controle_est_concre_db',
  user: process.env.PGUSER || 'controle_est_concre_user',
  password: process.env.PGPASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
});

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCP(cpVal) {
  if (!cpVal) return null;
  const cpStr = String(cpVal).trim();
  if (cpStr === '1' || cpStr === '2') return cpStr;
  if (cpStr.includes('Feb 01 2026') || cpStr.includes('01/02/2026') || cpStr.startsWith('Sun Feb 01')) {
    return '1';
  }
  if (cpStr.includes('Feb 02 2026') || cpStr.includes('02/02/2026') || cpStr.startsWith('Mon Feb 02')) {
    return '2';
  }
  const clean = cpStr.replace(/\s*\([^)]*\)\s*$/, '');
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    if (cpStr.includes('2026') && d.getUTCMonth() === 1) {
      return String(d.getUTCDate());
    }
    if (cpStr.includes('2026') && d.getMonth() === 1) {
      return String(d.getDate());
    }
  }
  return cpStr;
}

function normalizeRecord(body) {
  return {
    id: body.id || randomUUID(),
    source: body.source || 'qr-concreto',
    etiqueta_id: body.etiqueta_id || body.qr_raw || null,
    traco_id: body.traco_id || null,
    idade_dias: body.idade_dias === '' || body.idade_dias === undefined ? null : Number(body.idade_dias),
    cp: normalizeCP(body.cp),
    data_moldagem: body.data_moldagem || null,
    hora_moldagem: body.hora_moldagem || null,
    data_ruptura: body.data_ruptura || null,
    mpa: toNullableNumber(body.mpa),
    status_meta: body.status_meta || null,
    meta_min: toNullableNumber(body.meta_min),
    meta_max: toNullableNumber(body.meta_max),
    responsavel: body.operador || body.responsavel || null,
    qr_raw: body.qr_raw || null,
    payload_json: body,
    client_created_at: body.timestamp || null,
  };
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true, service: 'controle-est-concre-api' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/v1/rompimentos', async (req, res) => {
  const record = normalizeRecord(req.body || {});
  if (!record.traco_id || !record.cp || !record.idade_dias || record.mpa === null) {
    return res.status(400).json({ ok: false, error: 'Campos obrigatorios ausentes.' });
  }

  const sql = `
    insert into rompimentos (
      id, source, etiqueta_id, traco_id, idade_dias, cp,
      data_moldagem, hora_moldagem, data_ruptura, mpa,
      status_meta, meta_min, meta_max, responsavel,
      qr_raw, payload_json, client_created_at
    ) values (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16::jsonb, $17
    )
    on conflict (id) do update set
      source = excluded.source,
      etiqueta_id = excluded.etiqueta_id,
      traco_id = excluded.traco_id,
      idade_dias = excluded.idade_dias,
      cp = excluded.cp,
      data_moldagem = excluded.data_moldagem,
      hora_moldagem = excluded.hora_moldagem,
      data_ruptura = excluded.data_ruptura,
      mpa = excluded.mpa,
      status_meta = excluded.status_meta,
      meta_min = excluded.meta_min,
      meta_max = excluded.meta_max,
      responsavel = excluded.responsavel,
      qr_raw = excluded.qr_raw,
      payload_json = excluded.payload_json,
      client_created_at = excluded.client_created_at,
      updated_at = now()
    returning id, created_at, updated_at
  `;

  const params = [
    record.id,
    record.source,
    record.etiqueta_id,
    record.traco_id,
    record.idade_dias,
    record.cp,
    record.data_moldagem,
    record.hora_moldagem,
    record.data_ruptura,
    record.mpa,
    record.status_meta,
    record.meta_min,
    record.meta_max,
    record.responsavel,
    record.qr_raw,
    JSON.stringify(record.payload_json || {}),
    record.client_created_at,
  ];

  try {
    const result = await pool.query(sql, params);
    res.json({ ok: true, record: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/v1/rompimentos', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  try {
    const result = await pool.query(
      `select id, traco_id, idade_dias, cp, data_moldagem, data_ruptura, mpa, status_meta, responsavel, created_at, updated_at
       from rompimentos
       order by created_at desc
       limit $1`,
      [limit]
    );
    res.json({ ok: true, rows: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/v1/rompimentos-grupos', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  try {
    const result = await pool.query(
      `select data_moldagem, traco_id, idade_dias, mpa_cp1, mpa_cp2, media_mpa, status, data_ruptura
       from rompimentos_grupos
       order by data_moldagem desc, idade_dias asc
       limit $1`,
      [limit]
    );
    res.json({ ok: true, rows: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`controle-est-concre-api listening on ${port}`);
});
