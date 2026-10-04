"""Isolated test-only correction for duplicate inspection defect events.

The original Mapa source is never edited. The build applies this exact patch to
its copy, and fails closed if the source function changes.
"""

OLD = '''function removerReprovacoesDuplicadasDashboard(rows) {
  const historicos = new Set(rows.filter(isHistoricoReprovacao).map(row => String(row.id || row.key || "")));
  return rows.filter(row => isHistoricoReprovacao(row)
    || !historicos.has(getHistoricoReprovacaoKey(row.id || row.key, row.finalizado_em || row.finalizadoEm)));
}'''

NEW = '''function removerReprovacoesDuplicadasDashboard(rows) {
  const historicos = new Set(rows.filter(isHistoricoReprovacao).map(row => String(row.id || row.key || "")));
  const candidatos = rows.filter(row => isHistoricoReprovacao(row)
    || !historicos.has(getHistoricoReprovacaoKey(row.id || row.key, row.finalizado_em || row.finalizadoEm)));
  const eventos = new Map();
  for (const row of candidatos) {
    const defeitos = obterDefeitosRegistradosLinha(row);
    const inicio = Date.parse(row.inicio_inspecao_montagem || row.inicioInspecaoMontagem || "");
    const fim = Date.parse(row.finalizado_em || row.finalizadoEm || "");
    const peca = row.record_id || String(row.id || row.key || "").split(`||${ETAPA_HISTORICO_REPROVACAO}||`)[0];
    // Missing timestamps cannot identify an inspection safely; retain the row.
    if (!defeitos.length || !peca || !Number.isFinite(inicio) || !Number.isFinite(fim)) {
      eventos.set(Symbol(), row);
      continue;
    }
    const chave = JSON.stringify([peca, row.setor || "", inicio, fim,
      [...defeitos].sort()]);
    const anterior = eventos.get(chave);
    if (!anterior || (isHistoricoReprovacao(row) && !isHistoricoReprovacao(anterior))) {
      eventos.set(chave, row);
    }
  }
  return [...eventos.values()];
}'''


def apply(source: str) -> str:
    if source.count(OLD) != 1:
        raise RuntimeError("Original Mapa defect function changed; review patch")
    return source.replace(OLD, NEW, 1)
