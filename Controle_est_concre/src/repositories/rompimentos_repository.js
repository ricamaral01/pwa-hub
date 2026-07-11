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
    select data_moldagem, data_ruptura, traco_id, idade_dias, cp, mpa, updated_at, created_at
    from (
      select distinct on (data_moldagem, traco_id, idade_dias, cp)
        data_moldagem, data_ruptura, traco_id, idade_dias, cp, mpa, updated_at, created_at
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

module.exports = { listRompimentos };
