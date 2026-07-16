const database = require('../core/database');

function buildFilters(filters, dateColumn) {
  const clauses = [];
  const values = [];

  function add(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (filters.ano) {
    clauses.push(`extract(year from ${dateColumn}) = ${add(filters.ano)}`);
  }
  if (filters.mes) {
    clauses.push(`extract(month from ${dateColumn}) = ${add(filters.mes)}`);
  }
  if (filters.data_inicio) {
    clauses.push(`${dateColumn} >= ${add(filters.data_inicio)}::date`);
  }
  if (filters.data_fim) {
    clauses.push(`${dateColumn} <= ${add(filters.data_fim)}::date`);
  }

  return {
    where: clauses.length ? `where ${clauses.join(' and ')}` : '',
    values
  };
}

async function listRompimentosGrupos(filters) {
  const built = buildFilters(filters, 'data_moldagem');
  const limitParam = `$${built.values.length + 1}`;
  const offsetParam = `$${built.values.length + 2}`;
  const params = built.values.concat([filters.limit + 1, filters.offset]);

  const sql = `
    SELECT data_moldagem, data_ruptura, traco_id, idade_dias, 
           mpa_cp1, mpa_cp2, media_mpa, quantidade_cp, 
           status_resultado, meta_minima, meta_maxima
    FROM rompimentos_grupos
    ${built.where}
    ORDER BY data_moldagem DESC, traco_id ASC, idade_dias ASC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  const result = await database.query(sql, params);
  return result.rows;
}

async function listEstatisticaDiaria(filters) {
  const built = buildFilters(filters, 'data_referencia');
  const sql = `
    SELECT data_referencia, traco_id, idade_dias, quantidade_grupos, 
           quantidade_corpos_prova, quantidade_ok, quantidade_nok, quantidade_amp, 
           media_mpa, desvio_padrao, valor_minimo, valor_maximo
    FROM estatistica_diaria
    ${built.where}
    ORDER BY data_referencia DESC, traco_id ASC, idade_dias ASC
  `;
  const result = await database.query(sql, built.values);
  return result.rows;
}

async function listEstatisticaMensal(filters) {
  const clauses = [];
  const values = [];

  function add(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (filters.ano) {
    clauses.push(`split_part(ano_mes, '-', 1) = ${add(String(filters.ano))}`);
  }
  if (filters.mes) {
    clauses.push(`split_part(ano_mes, '-', 2) = ${add(String(filters.mes).padStart(2, '0'))}`);
  }

  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';

  const sql = `
    SELECT ano_mes, traco_id, idade_dias, quantidade_grupos, 
           quantidade_corpos_prova, quantidade_ok, quantidade_nok, quantidade_amp, 
           media_mpa, desvio_padrao, valor_minimo, valor_maximo
    FROM estatistica_mensal
    ${where}
    ORDER BY ano_mes DESC, traco_id ASC, idade_dias ASC
  `;
  const result = await database.query(sql, values);
  return result.rows;
}

module.exports = {
  listRompimentosGrupos,
  listEstatisticaDiaria,
  listEstatisticaMensal
};
