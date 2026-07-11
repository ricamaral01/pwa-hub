function publicError(code, message, status) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

function parseIntegerParam(value, name, fallback, min, max) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) {
    throw publicError('INVALID_PARAMETER', `Parametro invalido: ${name}.`, 400);
  }
  const parsed = Number.parseInt(value, 10);
  if (parsed < min || parsed > max) {
    throw publicError('INVALID_PARAMETER', `Parametro fora do limite: ${name}.`, 400);
  }
  return parsed;
}

function parseDateParam(value, name) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw publicError('INVALID_PARAMETER', `Parametro invalido: ${name}.`, 400);
  }
  return String(value);
}

function parseQuery(query, config) {
  const limit = parseIntegerParam(query.limit, 'limit', config.api.defaultLimit, 1, config.api.maxLimit);
  const offset = parseIntegerParam(query.offset, 'offset', 0, 0, 1000000);
  const mes = query.mes === undefined || query.mes === ''
    ? null
    : parseIntegerParam(query.mes, 'mes', null, 1, 12);
  const ano = query.ano === undefined || query.ano === ''
    ? null
    : parseIntegerParam(query.ano, 'ano', null, 2020, 2040);
  const dataInicio = parseDateParam(query.data_inicio, 'data_inicio');
  const dataFim = parseDateParam(query.data_fim, 'data_fim');

  if (dataInicio && dataFim && dataInicio > dataFim) {
    throw publicError('INVALID_PARAMETER', 'data_inicio nao pode ser maior que data_fim.', 400);
  }

  return {
    limit,
    offset,
    mes,
    ano,
    data_inicio: dataInicio,
    data_fim: dataFim,
  };
}

module.exports = { parseQuery, publicError };
