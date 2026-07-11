const express = require('express');
const { randomUUID } = require('crypto');
const database = require('../core/database');
const { listRompimentosGrupos } = require('../services/controle_estatistico_service');

const router = express.Router();

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCP(cpVal) {
  if (!cpVal) return null;
  let cpStr = String(cpVal).trim().replace(/^'/, '');
  if (cpStr === '1' || cpStr === '2') return cpStr;
  if (cpStr.includes('Feb 01 2026') || cpStr.includes('01/02/2026') || cpStr.startsWith('Sun Feb 01')) return '1';
  if (cpStr.includes('Feb 02 2026') || cpStr.includes('02/02/2026') || cpStr.startsWith('Mon Feb 02')) return '2';
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

router.post('/rompimentos', async (req, res, next) => {
  const record = normalizeRecord(req.body || {});
  if (!record.traco_id || !record.cp || !record.idade_dias || record.mpa === null) {
    res.status(400).json({ ok: false, error: 'Campos obrigatorios ausentes.' });
    return;
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

  try {
    const result = await database.query(sql, [
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
    ]);
    res.json({ ok: true, record: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/rompimentos', async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  try {
    const result = await database.query(
      `select id, traco_id, idade_dias, cp, data_moldagem, data_ruptura, mpa, status_meta, responsavel, created_at, updated_at
       from rompimentos
       order by created_at desc
       limit $1`,
      [limit]
    );
    res.json({ ok: true, rows: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/rompimentos-grupos', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 1000), 5000);
    const response = await listRompimentosGrupos({ limit, offset: 0, mes: null, ano: null, data_inicio: null, data_fim: null }, req.requestId);
    res.json({ ok: true, rows: response.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = { router };
