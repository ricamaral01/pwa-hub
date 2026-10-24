const express = require('express');
const database = require('../core/database');

const router = express.Router();

function validDate(value) {
  if (!value) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : false;
}

router.get('/massadas', async (req, res, next) => {
  try {
    const start = validDate(req.query.data_ini);
    const end = validDate(req.query.data_fim);
    if (start === false || end === false || (start && end && start > end)) {
      return res.status(400).json({ ok: false, error: 'Período inválido.' });
    }
    const limit = Number(req.query.limit || 200);
    const offset = Number(req.query.offset || 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500 ||
        !Number.isInteger(offset) || offset < 0 || offset > 100000) {
      return res.status(400).json({ ok: false, error: 'Paginação inválida.' });
    }
    const { rows } = await database.query(
      `SELECT id, numero_serie, produto, formula, qtd, data, hora, data_hora
       FROM public.tbl_massadas
       WHERE ($1::date IS NULL OR data >= $1::date)
         AND ($2::date IS NULL OR data <= $2::date)
       ORDER BY data DESC NULLS LAST, hora DESC NULLS LAST, id DESC
       LIMIT $3 OFFSET $4`,
      [start, end, limit + 1, offset]
    );
    const { rows: meta } = await database.query(
      'SELECT imported_at, source_count, source_max_id, source_max_data FROM public.cec_massadas_snapshot WHERE id = 1'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, rows: rows.slice(0, limit), has_more: rows.length > limit,
      snapshot: meta[0] || null });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, validDate };
