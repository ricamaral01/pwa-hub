/* Unified-only indicator header. Existing defect breakdown and filters stay in app.js. */
(() => {
  const originalRender = window.renderIndicadoresDefeitosMontagem;
  const originalPresentation = window.renderizarApresentacaoDefeitos;
  if (typeof originalRender !== 'function') throw new Error('Dashboard Defeitos original indisponível');
  let latest = null;
  let requestNumber = 0;
  const $ = id => document.getElementById(id);
  const number = value => Number(value || 0);
  const fmt = value => number(value).toLocaleString('pt-BR');
  const percent = (a, b) => b > 0 ? `${(100 * a / b).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%` : '—';
  const ratio = (a, b) => b > 0 ? (a / b).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '—';
  const sectorNames = ['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'];
  const fields = ['inspected', 'nonconforming', 'defects', 'opportunities', 'reworked', 'lost'];
  const blank = () => Object.fromEntries(fields.map(field => [field, 0]));
  const sum = names => names.reduce((all, name) => {
    const item = latest?.metrics?.sectors?.[name] || {};
    fields.forEach(field => { all[field] += number(item[field]); });
    return all;
  }, blank());

  function strictChecklist(indicators) {
    const strict = {
      ...indicators, totalErros: 0, porTipo: {}, ocorrenciasPorTipo: {}, matriz: {},
      porSetor: Object.fromEntries(Object.entries(indicators.porSetor || {}).map(([key, value]) =>
        [key, {...value, erros: 0}])),
      fissuras: {...indicators.fissuras, total: 0, circulares: 0, outros: 0},
    };
    const unspecified = {};
    const pending = {};
    for (const [type, rows] of Object.entries(indicators.ocorrenciasPorTipo || {})) {
      for (const row of rows) {
        if (!['FINALIZACAO', 'HISTORICO_REPROVACAO', 'INSPECAO', 'REINSPECAO'].includes(String(row.etapa || '').toUpperCase())) {
          (pending[type] ||= []).push(row);
          continue;
        }
        if (!obterOcorrenciasDefeitosLinha(row).length) {
          (unspecified[type] ||= []).push(row);
          continue;
        }
        strict.totalErros++;
        strict.porTipo[type] = (strict.porTipo[type] || 0) + 1;
        (strict.ocorrenciasPorTipo[type] ||= []).push(row);
        const sector = row.setor || 'Sem setor';
        (strict.porSetor[sector] ||= {setor: sector, erros: 0, producao: 0}).erros++;
        ((strict.matriz[type] ||= {})[sector] ||= 0);
        strict.matriz[type][sector]++;
        if (normalizarTexto(type).includes('fissura')) {
          strict.fissuras.total++;
          if (/circular|circ/i.test(row.modelo || '')) strict.fissuras.circulares++;
          else strict.fissuras.outros++;
        }
      }
    }
    return {strict, unspecified, pending};
  }

  function appendExcluded(unspecified, pending, production) {
    const host = $('miDefeitosPorTipo');
    const rows = [
      ...Object.entries(unspecified).map(([type, occurrences]) => [type, occurrences, 'sem item “NÃO”']),
      ...Object.entries(pending).map(([type, occurrences]) => [type, occurrences, 'ainda em checklist']),
    ];
    if (!host || !rows.length) return;
    let index = 0;
    for (const [type, occurrences, reason] of rows) {
      const entry = document.createElement('div');
      entry.className = 'df-defect-entry';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mi-defeito-tipo-row';
      button.textContent = `${type} · ${occurrences.length} registro(s) ${reason} — fora do total`;
      const panel = document.createElement('div');
      panel.className = 'df-defect-detail';
      panel.hidden = true;
      panel.id = `dfNewUnspecifiedDetail${index++}`;
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) panel.innerHTML = renderHtmlDetalheDefeito(type, occurrences, production);
      });
      entry.append(button, panel);
      host.append(entry);
    }
    const note = $('dfNewUnspecified');
    if (note) {
      note.hidden = false;
      note.textContent = 'Reprovações sem “NÃO” e registros ainda em checklist continuam no detalhe abaixo, fora dos indicadores de inspeções concluídas.';
    }
  }

  function renderTop() {
    if (!latest) return;
    const all = sum(sectorNames);
    const produced = sectorNames.reduce((total, name) => total + number(latest.production?.[name]?.producao), 0);
    const set = (id, text) => { if ($(id)) $(id).textContent = text; };
    set('dfNewInspected', fmt(all.inspected));
    set('dfNewCoverage', `Produzidos: ${fmt(produced)} · cobertura ${percent(all.inspected, produced)}`);
    set('dfNewNonconforming', `${fmt(all.nonconforming)} · ${percent(all.nonconforming, all.inspected)}`);
    set('dfNewNonconformingMeta', `${fmt(all.nonconforming)} ÷ ${fmt(all.inspected)} inspecionados`);
    set('dfNewFpy', percent(all.inspected - all.nonconforming, all.inspected));
    set('dfNewFpyMeta', `${fmt(all.inspected - all.nonconforming)} ÷ ${fmt(all.inspected)} inspecionados`);
    set('dfNewDefects', fmt(all.defects));
    set('dfNewDefectsMeta', `${ratio(100 * all.defects, all.inspected)} por 100 · ${fmt(all.defects)} ÷ ${fmt(all.inspected)}`);
    set('dfNewReworked', `${fmt(all.reworked)} · ${percent(all.reworked, all.inspected)}`);
    set('dfNewReworkedMeta', `${fmt(all.reworked)} ÷ ${fmt(all.inspected)} inspecionados`);
    set('dfNewLost', `${fmt(all.lost)} · ${percent(all.lost, all.inspected)}`);
    set('dfNewLostMeta', `${fmt(all.lost)} ÷ ${fmt(all.inspected)} inspecionados`);
    set('dfNewPerAffected', ratio(all.defects, all.nonconforming));
    set('dfNewPerAffectedMeta', `${fmt(all.defects)} “NÃO” ÷ ${fmt(all.nonconforming)} postes não conformes`);
    set('dfNewOpportunity', percent(all.defects, all.opportunities));
    set('dfNewOpportunityMeta', `${fmt(all.defects)} “NÃO” ÷ ${fmt(all.opportunities)} oportunidades`);

    const body = $('dfNewSectorRows');
    if (body) {
      body.replaceChildren();
      const entries = [['Total', sectorNames], ...sectorNames.map(name => [name, [name]]),
        ['S1 + S2', sectorNames.slice(0, 2)]];
      for (const [label, names] of entries) {
        const item = sum(names);
        if (!item.inspected) continue;
        const made = names.reduce((total, name) => total + number(latest.production?.[name]?.producao), 0);
        const row = document.createElement('tr');
        if (label === 'Total') row.className = 'is-total';
        const values = [label, fmt(made), fmt(item.inspected),
          `${fmt(item.inspected)}/${fmt(made)} · ${percent(item.inspected, made)}`,
          `${fmt(item.nonconforming)}/${fmt(item.inspected)} · ${percent(item.nonconforming, item.inspected)}`,
          `${fmt(item.inspected - item.nonconforming)}/${fmt(item.inspected)} · ${percent(item.inspected - item.nonconforming, item.inspected)}`,
          `${fmt(item.defects)}/${fmt(item.inspected)} · ${ratio(100 * item.defects, item.inspected)}`,
          `${fmt(item.reworked)}/${fmt(item.inspected)} · ${percent(item.reworked, item.inspected)}`,
          `${fmt(item.lost)}/${fmt(item.inspected)} · ${percent(item.lost, item.inspected)}`];
        values.forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); });
        body.append(row);
      }
    }

    const trend = $('dfNewTrend');
    if (trend) {
      trend.replaceChildren();
      for (const month of latest.metrics.months || []) {
        const row = document.createElement('div');
        row.className = 'df-new-trend-row';
        const label = document.createElement('strong');
        label.textContent = month.month.slice(5) + '/' + month.month.slice(0, 4);
        row.append(label);
        for (const [name, value, extra] of [
          ['Não conformes', month.nonconforming, ''],
          ['FPY', month.inspected - month.nonconforming, 'fpy']
        ]) {
          const bar = document.createElement('div');
          bar.className = 'df-new-trend-bar ' + extra;
          bar.title = `${name}: ${fmt(value)} ÷ ${fmt(month.inspected)} · ${percent(value, month.inspected)}`;
          const fill = document.createElement('i');
          fill.style.width = `${month.inspected ? 100 * value / month.inspected : 0}%`;
          const text = document.createElement('em');
          text.textContent = `${name} ${percent(value, month.inspected)}`;
          bar.append(fill, text); row.append(bar);
        }
        trend.append(row);
      }
      if (!trend.children.length) trend.textContent = 'Sem primeiras inspeções no período.';
    }
  }

  function updatePresentation() {
    if (!latest) return;
    const all = sum(sectorNames);
    const hero = document.querySelector('.df-slide-overview .df-slide-rate-hero');
    if (hero) {
      hero.replaceChildren();
      const label = document.createElement('span'); label.textContent = 'Postes não conformes';
      const value = document.createElement('strong'); value.textContent = percent(all.nonconforming, all.inspected);
      const meta = document.createElement('small'); meta.textContent = `${fmt(all.nonconforming)} de ${fmt(all.inspected)} inspecionados`;
      hero.append(label, value, meta);
    }
    const grid = document.querySelector('.df-slide-overview .df-slide-kpi-grid');
    if (grid) {
      const items = [
        ['Inspecionados', fmt(all.inspected), 'Primeira inspeção'],
        ['FPY', percent(all.inspected - all.nonconforming, all.inspected), `${fmt(all.inspected - all.nonconforming)} de ${fmt(all.inspected)}`],
        ['Defeitos encontrados', fmt(all.defects), `${ratio(100 * all.defects, all.inspected)} por 100 postes`],
        ['Retrabalhados', `${fmt(all.reworked)} · ${percent(all.reworked, all.inspected)}`, `Perdas: ${fmt(all.lost)} · ${percent(all.lost, all.inspected)}`],
      ];
      grid.replaceChildren();
      for (const [label, value, note] of items) {
        const card = document.createElement('article'); card.className = 'df-slide-kpi';
        const a = document.createElement('span'); a.textContent = label;
        const b = document.createElement('strong'); b.textContent = value;
        const c = document.createElement('small'); c.textContent = note;
        card.append(a, b, c); grid.append(card);
      }
    }
    document.querySelectorAll('.df-slide-sector-view .df-slide-sector-card').forEach(card => {
      const sector = card.querySelector('header strong')?.textContent?.trim();
      const value = latest.metrics.sectors?.[sector];
      if (!value?.inspected) return;
      const detail = document.createElement('small');
      detail.textContent = `${fmt(value.inspected)} inspecionados · NC ${percent(value.nonconforming, value.inspected)} · FPY ${percent(value.inspected - value.nonconforming, value.inspected)}`;
      card.append(detail);
    });
    const method = document.querySelector('.df-slide-action-view .df-slide-method-grid');
    if (method) {
      const labels = [
        ['Principal', 'Postes não conformes', `${fmt(all.nonconforming)} ÷ ${fmt(all.inspected)} = ${percent(all.nonconforming, all.inspected)}`],
        ['Primeira passagem', 'FPY', `${fmt(all.inspected - all.nonconforming)} ÷ ${fmt(all.inspected)} = ${percent(all.inspected - all.nonconforming, all.inspected)}`],
        ['Técnico', 'Taxa por oportunidade', `${fmt(all.defects)} ÷ ${fmt(all.opportunities)} = ${percent(all.defects, all.opportunities)}`],
      ];
      method.replaceChildren();
      for (const [tag, title, formula] of labels) {
        const card = document.createElement('article'); card.className = 'df-slide-method-card';
        const a = document.createElement('span'); a.textContent = tag;
        const b = document.createElement('strong'); b.textContent = title;
        const c = document.createElement('p'); c.textContent = formula;
        card.append(a, b, c); method.append(card);
      }
    }
  }

  window.renderIndicadoresDefeitosMontagem = function(indicators, productionRows = []) {
    if (!document.body.classList.contains('mode-dashboard-defeitos') || !indicators.ocorrenciasPorTipo) {
      return originalRender(indicators, productionRows);
    }
    const sequence = ++requestNumber;
    latest = null;
    const {strict, unspecified, pending} = strictChecklist(indicators);
    originalRender(strict, productionRows);
    appendExcluded(unspecified, pending, productionRows);
    const params = new URLSearchParams({
      inicio: $('dfDataInicio')?.value || todayYmd(), fim: $('dfDataFim')?.value || todayYmd(),
      setor: $('dfFiltroSetor')?.value || '', status: $('dfFiltroStatus')?.value || '',
      busca: $('dfFiltroPesquisa')?.value || '',
    });
    fetch(`/unificado/mapa/api/dashboard/defeitos/indicadores?${params}`, {
      credentials: 'same-origin', cache: 'no-store'
    }).then(response => {
      if (!response.ok) throw new Error(`Indicadores indisponíveis (${response.status})`);
      return response.json();
    }).then(metrics => {
      if (sequence !== requestNumber) return;
      latest = {metrics, strict, production: indicators.porSetor || {}};
      renderTop();
      if (miDefeitosExportData) {
        miDefeitosExportData.kpis.total_erros = strict.totalErros;
        miDefeitosExportData.bySector = strict.porSetor;
        miDefeitosExportData.byDefect = strict.porTipo;
        miDefeitosExportData.defectMatrix = strict.matriz;
      }
      if (!$('dfPresentationOverlay')?.classList.contains('hidden')) renderizarApresentacaoDefeitos();
    }).catch(error => {
      if (sequence !== requestNumber) return;
      const note = $('dfNewUnspecified');
      if (note) { note.hidden = false; note.textContent = error.message; }
    });
  };

  if (typeof originalPresentation === 'function') {
    window.renderizarApresentacaoDefeitos = function() {
      originalPresentation();
      updatePresentation();
    };
  }

  function exportRows() {
    if (!latest || !miDefeitosExportData) return null;
    const data = miDefeitosExportData;
    const all = sum(sectorNames);
    const produced = sectorNames.reduce((n, sector) => n + number(latest.production?.[sector]?.producao), 0);
    const rows = [
      ['Dashboard de Defeitos'],
      ['Periodo', $('dfDataInicio')?.value, $('dfDataFim')?.value],
      ['Escopo', data.scope], [],
      ['Indicador', 'Valor', 'Numerador', 'Denominador'],
      ['Producao', produced], ['Postes inspecionados', all.inspected],
      ['Cobertura de inspecao', percent(all.inspected, produced), all.inspected, produced],
      ['Postes nao conformes', percent(all.nonconforming, all.inspected), all.nonconforming, all.inspected],
      ['FPY', percent(all.inspected - all.nonconforming, all.inspected), all.inspected - all.nonconforming, all.inspected],
      ['Defeitos encontrados', all.defects],
      ['Defeitos por 100 postes', ratio(100 * all.defects, all.inspected), all.defects, all.inspected],
      ['Defeitos por poste nao conforme', ratio(all.defects, all.nonconforming), all.defects, all.nonconforming],
      ['Retrabalhados', percent(all.reworked, all.inspected), all.reworked, all.inspected],
      ['Perda do poste', percent(all.lost, all.inspected), all.lost, all.inspected],
      ['Taxa de nao conformidade por oportunidade', percent(all.defects, all.opportunities), all.defects, all.opportunities],
      [], ['Indicadores por setor'],
      ['Setor', 'Produzidos', 'Inspecionados', 'Nao conformes (n)', 'Nao conformes (%)',
        'Aprovados de primeira (n)', 'FPY (%)', 'Defeitos (n)', 'Defeitos por 100',
        'Retrabalhados (n)', 'Retrabalho (%)', 'Perdas (n)', 'Perda (%)'],
    ];
    for (const [sector, names] of [['Total', sectorNames],
      ...sectorNames.map(name => [name, [name]]), ['S1 + S2', sectorNames.slice(0, 2)]]) {
      const value = sum(names);
      if (!value.inspected) continue;
      const made = names.reduce((n, name) => n + number(latest.production?.[name]?.producao), 0);
      rows.push([sector, made, value.inspected,
        value.nonconforming, percent(value.nonconforming, value.inspected),
        value.inspected - value.nonconforming,
        percent(value.inspected - value.nonconforming, value.inspected),
        value.defects, ratio(100 * value.defects, value.inspected),
        value.reworked, percent(value.reworked, value.inspected),
        value.lost, percent(value.lost, value.inspected)]);
    }
    rows.push([], ['Tendencia mensal'], ['Mes', 'Inspecionados', 'Nao conformes', 'FPY']);
    for (const month of latest.metrics.months || []) rows.push([month.month, month.inspected,
      percent(month.nonconforming, month.inspected),
      percent(month.inspected - month.nonconforming, month.inspected)]);
    rows.push([], ['Taxa de defeitos por setor'], ['Setor', 'Produzidos', 'Erros', 'Taxa/producao']);
    for (const sector of data.includedSectors || []) {
      const item = data.bySector?.[sector] || {};
      rows.push([sector, number(item.producao), number(item.erros), percent(item.erros, item.producao)]);
    }
    rows.push([], ['Matriz defeito x setor'], ['Defeito', ...(data.includedSectors || []), 'Total']);
    for (const [type, total] of Object.entries(data.byDefect || {}).sort((a,b) => b[1]-a[1])) {
      const matrix = data.defectMatrix?.[type] || {};
      rows.push([type, ...(data.includedSectors || []).map(sector => number(matrix[sector])), total]);
    }
    return rows;
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('#dfBtnExportarCsv')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const rows = exportRows();
    if (!rows) { showMsgBox('Atualize os indicadores antes de exportar.', 'error'); return; }
    const start = $('dfDataInicio')?.value || ''; const end = $('dfDataFim')?.value || '';
    baixarArquivoBlob(criarCsv(rows), `dashboard_defeitos_${start}_a_${end}.csv`, 'text/csv;charset=utf-8', true);
    showMsgBox('Dashboard de defeitos exportado em CSV.', 'success');
  }, true);

  $('dfNewExportXlsx')?.addEventListener('click', async () => {
    const rows = exportRows();
    if (!rows) { showMsgBox('Atualize os indicadores antes de exportar.', 'error'); return; }
    if (!window.XLSX?.utils) { showMsgBox('Biblioteca XLSX indisponível.', 'error'); return; }
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.aoa_to_sheet(rows), 'Defeitos');
    await salvarWorkbookXlsx(workbook, `dashboard_defeitos_${$('dfDataInicio')?.value}_a_${$('dfDataFim')?.value}.xlsx`);
  });
})();
