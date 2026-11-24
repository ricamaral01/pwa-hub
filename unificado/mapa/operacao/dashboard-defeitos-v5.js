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

  const pieceFields = ['produced', 'inspected', 'affected', 'critical', 'noncritical_only'];
  const sumPieces = (names = sectorNames) => names.reduce((all, name) => {
    const item = latest?.metrics?.production_cohort?.[name] || {};
    pieceFields.forEach(field => { all[field] += number(item[field]); });
    return all;
  }, Object.fromEntries(pieceFields.map(field => [field, 0])));

  function renderPieces() {
    const set = (id, value) => { if ($(id)) $(id).textContent = value; };
    if (!latest?.metrics?.production_cohort) {
      ['dfPieceAffected', 'dfPieceCritical'].forEach(id => set(id, '—'));
      ['dfPieceCoverage', 'dfPieceAffectedMeta', 'dfPieceCriticalMeta'].forEach(id =>
        set(id, 'Indicadores por produção indisponíveis. Atualize os dados.'));
      set('dfPieceBreakdown', '');
      return;
    }
    const item = sumPieces();
    set('dfPieceAffected', percent(item.affected, item.produced));
    set('dfPieceCritical', percent(item.critical, item.produced));
    set('dfPieceAffectedMeta', `${fmt(item.affected)} de ${fmt(item.produced)} postes produzidos`);
    set('dfPieceCriticalMeta', `${fmt(item.critical)} de ${fmt(item.produced)} postes produzidos`);
    set('dfPieceCoverage', `${fmt(item.produced)} produzidos · ${fmt(item.inspected)} inspecionados (${percent(item.inspected, item.produced)}) · ${fmt(item.produced - item.inspected)} aguardando inspeção vinculada`);
    set('dfPieceBreakdown', `${fmt(item.critical)} com defeito crítico · ${fmt(item.noncritical_only)} somente com defeitos não críticos · ${fmt(item.inspected - item.affected)} inspecionados sem defeito registrado. Cada poste aparece em um único grupo.`);
  }

  function previousMonthDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    const target = new Date(Date.UTC(year, month - 2, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }

  const relativePercent = (current, previous) => previous > 0
    ? `${current > previous ? '+' : ''}${(100 * (current - previous) / previous).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`
    : current > 0 ? 'novo' : '0,00%';

  function previousBreakdown(base, start, end, sector, status, search) {
    const inSector = row => !sector || normalizarTexto(sector).startsWith('todos') ||
      (sector === 'Setores 1 e 2' ? ['Setor 1', 'Setor 2'].includes(row.setor) : row.setor === sector);
    const inStatus = row => !status || normalizarTexto(status).startsWith('todos') ||
      (status === 'A' ? String(row.status_montagem || '').toUpperCase() === 'A' && !isLinhaDefeitoDashboard(row) :
        status === 'R' ? isLinhaDefeitoDashboard(row) : String(row.status_montagem || '').toUpperCase() === status.toUpperCase());
    const inSearch = row => !search || [row.forma_numero, row.forma, row.modelo, row.montador_nome]
      .some(value => String(value || '').toLowerCase().includes(search));
    const rows = removerReprovacoesDuplicadasDashboard(base.montagemRes.rows || []).filter(row => {
      const day = getMiDataReferencia(row);
      return isLinhaAvaliacaoDefeitosDashboard(row) && day >= start && day <= end &&
        inSector(row) && inStatus(row) && inSearch(row);
    });
    const formKey = row => `${row.data_fabricacao || ''}|${row.setor || ''}|${normalizeForma(row.forma_numero || row.forma || '')}`;
    const matchedForms = new Set(rows.map(formKey));
    const production = (base.producaoRes.rows || []).filter(row =>
      row.data_fabricacao >= start && row.data_fabricacao <= end &&
      inSector(row) && (!search || inSearch(row) || matchedForms.has(formKey(row))));
    return strictChecklist(calcularIndicadoresDefeitosMontagem(rows, production)).strict;
  }

  function addQualityBadge(card, current, prior, higherIsBetter, metric = 'taxa') {
    card.querySelector('.df-month-badge')?.remove();
    const badge = document.createElement('span');
    const delta = current - prior;
    const trend = Math.abs(delta) < 0.005 ? 'neutral' :
      (delta > 0) === higherIsBetter ? 'better' : 'worse';
    badge.className = `df-month-badge is-${trend}`;
    badge.title = `Variação relativa da ${metric} frente ao mês anterior`;
    badge.textContent = trend === 'neutral' ? '→ 0,00% · Estável' :
      `${delta > 0 ? '↑' : '↓'} ${relativePercent(current, prior)} · ${trend === 'better' ? 'Melhor' : 'Pior'}`;
    return badge;
  }

  function renderMonthComparison(previous, previousStrict) {
    if (!latest) return;
    const now = sum(sectorNames);
    const before = sectorNames.reduce((all, name) => {
      const item = previous.sectors?.[name] || {};
      fields.forEach(field => { all[field] += number(item[field]); });
      return all;
    }, blank());
    const produced = sectorNames.reduce((total, name) => total + number(latest.production?.[name]?.producao), 0);
    const priorProduced = number(previousStrict.producao);
    const comparisons = [
      ['dfNewInspected', now.inspected, before.inspected, [now.inspected, produced, before.inspected, priorProduced], true],
      ['dfNewNonconforming', now.nonconforming, before.nonconforming, [now.nonconforming, now.inspected, before.nonconforming, before.inspected], false],
      ['dfNewFpy', now.inspected - now.nonconforming, before.inspected - before.nonconforming,
        [now.inspected - now.nonconforming, now.inspected, before.inspected - before.nonconforming, before.inspected], true],
      ['dfNewDefects', now.defects, before.defects, [now.defects * 100, now.inspected, before.defects * 100, before.inspected], false, 'por 100'],
      ['dfNewReworked', now.reworked, before.reworked, [now.reworked, now.inspected, before.reworked, before.inspected], false],
      ['dfNewLost', now.lost, before.lost, [now.lost, now.inspected, before.lost, before.inspected], false],
    ];
    for (const [id, current, prior, rate, higherIsBetter] of comparisons) {
      const value = $(id);
      const card = value?.closest('.df-new-card, .df-new-loss');
      if (!card) continue;
      card.querySelector('.df-month-comparison')?.remove();
      const note = document.createElement('small');
      note.className = 'df-month-comparison';
      note.textContent = `Mês anterior: ${fmt(prior)}`;
      const details = card.querySelector('details');
      if (details) details.before(note); else card.append(note);
      if (rate && rate[1] > 0 && rate[3] > 0) {
        value.after(addQualityBadge(card, 100 * rate[0] / rate[1], 100 * rate[2] / rate[3], higherIsBetter));
      }
    }
  }

  function renderParticipationComparison(currentStrict, previousStrict) {
    for (const [containerId, currentTypes, priorTypes, currentTotal, priorTotal] of [
      ['miDefMatriz', currentStrict.porTipo, previousStrict.porTipo, currentStrict.totalErros, previousStrict.totalErros],
      ...[1, 2].map(sector => {
        const current = criarParticipacaoDefeitosPorSetor(currentStrict.matriz, sector);
        const prior = criarParticipacaoDefeitosPorSetor(previousStrict.matriz, sector);
        return [`miDefMatrizS${sector}`, current.porTipo, prior.porTipo, current.total, prior.total];
      })
    ]) {
      const host = $(containerId);
      if (!host) continue;
      const heading = host.closest('.df-v4-panel')?.querySelector('.df-v4-panel-head small');
      if (heading) heading.textContent = 'Mês em análise × mês anterior';
      const totalBadge = $(containerId === 'miDefMatriz' ? 'miDefMatrizTotal' : `${containerId}Total`);
      if (totalBadge) totalBadge.textContent = `${fmt(currentTotal)} ocorrências`;
      const types = [...new Set([...Object.keys(currentTypes), ...Object.keys(priorTypes)])]
        .sort((a, b) => number(currentTypes[b]) + number(priorTypes[b]) - number(currentTypes[a]) - number(priorTypes[a]) || a.localeCompare(b, 'pt-BR'));
      const maxCount = Math.max(1, ...types.flatMap(type => [number(currentTypes[type]), number(priorTypes[type])]));
      host.classList.add('df-comparison-chart');
      if (containerId === 'miDefMatriz') host.closest('.df-v4-layout')?.classList.add('df-participation-layout');
      host.replaceChildren();
      const headers = document.createElement('div');
      headers.className = 'df-comparison-heads';
      for (const [label, total] of [['Mês em análise', currentTotal], ['Mês anterior', priorTotal]]) {
        const header = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = label;
        const count = document.createElement('span'); count.textContent = `${fmt(total)} ocorrências`;
        header.append(title, count);
        if (label === 'Mês em análise') header.append(addQualityBadge(header, currentTotal, priorTotal, false, 'ocorrências'));
        headers.append(header);
      }
      host.append(headers);
      if (!types.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Sem defeitos nos dois meses.';
        host.append(empty);
        continue;
      }
      for (const type of types) {
        const pair = document.createElement('div');
        pair.className = 'df-comparison-pair';
        for (const [count, total, currentColumn] of [
          [number(currentTypes[type]), currentTotal, true],
          [number(priorTypes[type]), priorTotal, false]
        ]) {
          const item = document.createElement('div');
          item.className = 'df-comparison-item';
          const label = document.createElement('div');
          label.className = 'df-comparison-label';
          const dot = document.createElement('i');
          dot.style.background = getDashboardDefectColor(type);
          const name = document.createElement('span'); name.textContent = type;
          label.append(dot, name);
          const track = document.createElement('div');
          track.className = 'df-comparison-track';
          const fill = document.createElement('div');
          fill.className = 'df-comparison-fill';
          fill.style.background = getDashboardDefectColor(type);
          fill.style.width = `${100 * count / maxCount}%`;
          const value = document.createElement('strong');
          value.textContent = `${fmt(count)} · ${percent(count, total)}`;
          track.append(fill, value);
          item.append(label, track);
          if (currentColumn) {
            const rate = currentTotal > 0 ? 100 * count / currentTotal : count;
            const priorCount = number(priorTypes[type]);
            const priorRate = priorTotal > 0 ? 100 * priorCount / priorTotal : priorCount;
            item.append(addQualityBadge(item, rate, priorRate, false, 'participação'));
          }
          pair.append(item);
        }
        host.append(pair);
      }
    }
  }

  const historical2026 = [
    [119, 2657], [499, 4174], [332, 4819], [402, 4142], [240, 3327],
    [253, 3823], [282, 4698], [258, 4292], [298, 4083]
  ];
  // Snapshot checked against the production database on 06/11/2026; refreshed when October is opened.
  let historicalOctober = [80, 3838];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  function setHistoricalOctober(base) {
    const october = previousBreakdown(base, '2026-10-01', '2026-10-31', '', '', '');
    if (october.producao > 0) historicalOctober = [october.totalErros, october.producao];
  }

  function renderAnnualChart(year, liveMetrics = null) {
    const cards = document.querySelector('#miSecaoDefeitos .df-new-cards');
    const closing = $('dfMonthlyClosing');
    if (!cards && !closing) return;
    let panel = $('dfAnnualPanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'dfAnnualPanel';
      panel.className = 'df-annual-panel';
    }
    if (closing && panel.parentElement !== closing) closing.append(panel);
    else if (!panel.parentElement) cards.after(panel);
    const historical = year === '2026';
    const liveRows = Object.fromEntries((liveMetrics?.months || []).map(item => [item.month, item]));
    const view = panel.dataset.view === 'live' && liveMetrics ? 'live' : historical ? 'history' : 'live';
    panel.dataset.view = view;
    const points = monthNames.map((name, index) => {
      const history = index === 9 ? historicalOctober : historical2026[index];
      const live = liveRows[`${year}-${String(index + 1).padStart(2, '0')}`];
      const numerator = view === 'history' ? history?.[0] : live?.nonconforming;
      const denominator = view === 'history' ? history?.[1] : live?.inspected;
      return {name, numerator: number(numerator), denominator: number(denominator),
        value: denominator > 0 ? 100 * number(numerator) / number(denominator) : null};
    });
    const valid = points.map((point, monthIndex) => ({...point, monthIndex}))
      .filter(point => point.value !== null);
    const meanCount = valid.reduce((total, point) => total + point.numerator, 0);
    const meanBase = valid.reduce((total, point) => total + point.denominator, 0);
    const mean = meanBase > 0 ? 100 * meanCount / meanBase : 0;
    const targetRate = view === 'history' ? 4.5 : null;
    const max = Math.max(5, Math.ceil(Math.max(...valid.map(point => point.value), mean, targetRate || 0) / 2) * 2);
    const x = index => valid.length === 1 ? 440 : 56 + index * 774 / (valid.length - 1);
    const y = value => 218 - value / max * 178;
    const segments = [];
    let segment = [];
    valid.forEach((point, index) => {
      if (index && point.monthIndex !== valid[index - 1].monthIndex + 1) {
        if (segment.length) segments.push(segment);
        segment = [];
      }
      segment.push(`${x(index).toFixed(1)},${y(point.value).toFixed(1)}`);
    });
    if (segment.length) segments.push(segment);
    panel.replaceChildren();
    const head = document.createElement('div');
    head.className = 'df-annual-head';
    const title = document.createElement('div');
    title.innerHTML = `<h3>Evolução anual mês a mês · ${year}</h3><p>${view === 'history'
      ? 'Histórico enviado, total geral: defeitos ÷ produção total (peças). Meta informada: 4,5%.'
      : 'Dados do painel: postes não conformes ÷ postes inspecionados na primeira inspeção.'}</p>`;
    const controls = document.createElement('div');
    controls.className = 'df-annual-controls';
    for (const [mode, label, enabled] of [
      ['history', 'Histórico enviado', historical], ['live', 'Painel atual', Boolean(liveMetrics)]
    ]) {
      if (!enabled) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = mode === view ? 'is-active' : '';
      button.setAttribute('aria-pressed', String(mode === view));
      button.addEventListener('click', () => { panel.dataset.view = mode; renderAnnualChart(year, liveMetrics); });
      controls.append(button);
    }
    head.append(title, controls);
    panel.append(head);
    if (!valid.length) {
      const empty = document.createElement('p');
      empty.textContent = liveMetrics ? 'Sem inspeções neste ano e nos filtros selecionados.' : 'Carregando dados mensais do painel…';
      panel.append(empty);
      return;
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 890 275');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Evolução mensal de ${view === 'history' ? 'defeitos sobre produção' : 'postes não conformes sobre inspecionados'} em ${year}`);
    const ticks = [0, max / 2, max];
    const grid = ticks.map(value => `<line x1="50" y1="${y(value)}" x2="830" y2="${y(value)}" stroke="#dce6f2"/><text x="42" y="${y(value) + 4}" text-anchor="end" fill="#52647a" font-size="11">${value.toLocaleString('pt-BR', {maximumFractionDigits: 1})}%</text>`).join('');
    const target = targetRate !== null ? `<line x1="50" y1="${y(targetRate)}" x2="830" y2="${y(targetRate)}" stroke="#d97706" stroke-width="2" stroke-dasharray="6 5"/>` : '';
    const meanLine = `<line x1="50" y1="${y(mean)}" x2="830" y2="${y(mean)}" stroke="#7c3aed" stroke-width="2" stroke-dasharray="3 4"/>`;
    const lines = segments.map(pointsInLine => `<polyline points="${pointsInLine.join(' ')}" fill="none" stroke="#2364cf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const dots = valid.map((point, index) =>
      `<circle cx="${x(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="6" fill="${view === 'history' && point.value > 4.5 ? '#d33a35' : '#2364cf'}"><title>${point.name}/${year}: ${percent(point.numerator, point.denominator)} · ${fmt(point.numerator)} / ${fmt(point.denominator)}</title></circle>`).join('');
    const dataLabels = valid.map((point, index) => {
      const top = Math.max(3, y(point.value) - 35);
      return `<rect x="${(x(index) - 27).toFixed(1)}" y="${top.toFixed(1)}" width="54" height="21" rx="5" fill="#fff" stroke="#dce6f2"/><text x="${x(index).toFixed(1)}" y="${(top + 15).toFixed(1)}" text-anchor="middle" fill="#183653" font-size="12" font-weight="700">${point.value.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})}%</text>`;
    }).join('');
    const labels = valid.map((point, index) => `<text x="${x(index).toFixed(1)}" y="245" text-anchor="middle" fill="#314a67" font-size="12">${point.name}</text>`).join('');
    svg.innerHTML = `${grid}${target}${meanLine}${lines}${dots}${dataLabels}${labels}`;
    const legend = document.createElement('div');
    legend.className = 'df-annual-legend';
    legend.innerHTML = `<span><i class="df-legend-actual"></i>Taxa mensal</span><span><i class="df-legend-mean"></i>Média ${percent(meanCount, meanBase)}</span>${targetRate === null ? '' : `<span><i class="df-legend-target"></i>Meta 4,5%</span>`}`;
    panel.append(legend);
    panel.append(svg);
    const detail = document.createElement('div');
    detail.className = 'df-annual-values';
    for (const point of valid) {
      const item = document.createElement('span');
      item.textContent = `${point.name}: ${percent(point.numerator, point.denominator)} (${fmt(point.numerator)}/${fmt(point.denominator)})`;
      detail.append(item);
    }
    panel.append(detail);
    const source = document.createElement('small');
    source.textContent = view === 'history'
      ? 'Fonte: imagem enviada (jan–set/2026, total geral); outubro: Uni, conferido em 06/11/2026. Média = total de defeitos ÷ total produzido nos meses com dados.'
      : 'Fonte: inspeções registradas no Uni. Aplicados os mesmos filtros de setor, status e busca; período anual completo.';
    panel.append(source);
  }

  function renderReported() {
    const reported = latest?.metrics?.reported || {};
    const panel = $('dfReportedPanel');
    if (!panel) return;
    panel.hidden = !number(reported.total);
    if (panel.hidden) return;
    $('dfReportedTotal').textContent = fmt(reported.total);
    $('dfReportedTypes').textContent = (reported.by_type || [])
      .map(item => `${item.type}: ${fmt(item.count)}.`).join(' ');
    for (const [target, entries, key] of [
      ['dfReportedModels', reported.by_model || [], 'model'],
      ['dfReportedDays', reported.by_day || [], 'day']
    ]) {
      const body = $(target);
      if (!body) continue;
      body.replaceChildren();
      for (const entry of entries) {
        const row = document.createElement('tr');
        for (const value of [entry[key], fmt(entry.count)]) {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.append(cell);
        }
        body.append(row);
      }
    }
  }

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
    renderReported();
    renderPieces();
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
        ['Retrabalhados', `${fmt(all.reworked)} · ${percent(all.reworked, all.inspected)}`,
          `Perdas: ${fmt(all.lost)} · ${percent(all.lost, all.inspected)} · Reprovados (legado): ${fmt(dfPresentationData?.postesReprovados)}`],
      ];
      if (number(latest.metrics.reported?.total)) items.push([
        'Defeitos informados sem vínculo', fmt(latest.metrics.reported.total),
        'Ocorrências recebidas, fora dos índices por poste'
      ]);
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
    for (const id of ['dfPieceAffected', 'dfPieceCritical']) {
      if ($(id)) $(id).textContent = '—';
    }
    for (const id of ['dfPieceCoverage', 'dfPieceAffectedMeta', 'dfPieceCriticalMeta']) {
      if ($(id)) $(id).textContent = 'Carregando…';
    }
    if ($('dfPieceBreakdown')) $('dfPieceBreakdown').textContent = '';
    const {strict, unspecified, pending} = strictChecklist(indicators);
    originalRender(strict, productionRows);
    appendExcluded(unspecified, pending, productionRows);
    const params = new URLSearchParams({
      inicio: $('dfDataInicio')?.value || todayYmd(), fim: $('dfDataFim')?.value || todayYmd(),
      setor: $('dfFiltroSetor')?.value || '', status: $('dfFiltroStatus')?.value || '',
      busca: $('dfFiltroPesquisa')?.value || '',
    });
    const previousStart = previousMonthDate(params.get('inicio'));
    const previousEnd = previousMonthDate(params.get('fim'));
    const previousParams = new URLSearchParams(params);
    previousParams.set('inicio', previousStart);
    previousParams.set('fim', previousEnd);
    const analysisMonthStart = `${params.get('fim').slice(0, 7)}-01`;
    const [monthYear, monthNumber] = analysisMonthStart.split('-').map(Number);
    const analysisMonthEnd = new Date(Date.UTC(monthYear, monthNumber, 0)).toISOString().slice(0, 10);
    const priorMonthStart = previousMonthDate(analysisMonthStart);
    const priorMonthEnd = previousMonthDate(analysisMonthEnd);
    const combinedStart = previousStart < priorMonthStart ? previousStart : priorMonthStart;
    const combinedEnd = previousEnd > analysisMonthEnd ? previousEnd : analysisMonthEnd;
    document.querySelectorAll('#miSecaoDefeitos .df-month-comparison, #miSecaoDefeitos .df-month-badge, #miSecaoDefeitos .df-month-row, #miSecaoDefeitos .df-month-zero, #miSecaoDefeitos .df-month-period')
      .forEach(node => node.remove());
    const year = params.get('fim').slice(0, 4);
    const annualParams = new URLSearchParams(params);
    annualParams.set('inicio', `${year}-01-01`);
    annualParams.set('fim', `${year}-12-31`);
    let annualMetrics = null;
    renderAnnualChart(year);
    const loadMetrics = query => fetch(`/unificado/mapa/api/dashboard/defeitos/indicadores?${query}`, {
      credentials: 'same-origin', cache: 'no-store'
    }).then(response => {
      if (!response.ok) throw new Error(`Indicadores indisponíveis (${response.status})`);
      return response.json();
    });
    loadMetrics(params).then(metrics => {
      if (sequence !== requestNumber) return;
      latest = {metrics, strict, production: indicators.porSetor || {}};
      renderTop();
      loadMetrics(annualParams).then(annual => {
        if (sequence === requestNumber) {
          annualMetrics = annual;
          renderAnnualChart(year, annual);
        }
      }).catch(error => {
        if (sequence !== requestNumber) return;
        const panel = $('dfAnnualPanel');
        if (panel && year !== '2026') panel.textContent = `Evolução anual indisponível: ${error.message}`;
      });
      Promise.all([loadMetrics(previousParams), obterBaseDashboardDefeitos(combinedStart, combinedEnd)])
        .then(([previous, previousBase]) => {
          if (sequence !== requestNumber) return;
          const sector = params.get('setor');
          const status = params.get('status');
          const search = params.get('busca').trim().toLowerCase();
          const previousStrict = previousBreakdown(previousBase, previousStart, previousEnd,
            sector, status, search);
          renderMonthComparison(previous, previousStrict);
          const currentMonth = previousBreakdown(previousBase, analysisMonthStart, analysisMonthEnd,
            sector, status, search);
          const priorMonth = previousBreakdown(previousBase, priorMonthStart, priorMonthEnd,
            sector, status, search);
          renderParticipationComparison(currentMonth, priorMonth);
          if (analysisMonthStart === '2026-10-01') {
            setHistoricalOctober(previousBase);
            renderAnnualChart(year, annualMetrics);
          }
        }).catch(error => {
          if (sequence !== requestNumber) return;
          const note = $('dfNewUnspecified');
          if (note) { note.hidden = false; note.textContent = `Comparativo do mês anterior indisponível: ${error.message}`; }
        });
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
      for (const id of ['dfPieceCoverage', 'dfPieceAffectedMeta', 'dfPieceCriticalMeta']) {
        if ($(id)) $(id).textContent = 'Indicadores por produção indisponíveis. Atualize os dados.';
      }
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
    const pieces = latest.metrics.production_cohort ? sumPieces() : null;
    const produced = sectorNames.reduce((n, sector) => n + number(latest.production?.[sector]?.producao), 0);
    const rows = [
      ['Dashboard de Defeitos'],
      ['Periodo', $('dfDataInicio')?.value, $('dfDataFim')?.value],
      ['Escopo', data.scope], [],
      ['Indicador', 'Valor', 'Numerador', 'Denominador'],
      ['Postes produzidos (base por peça)', pieces?.produced ?? 'Indisponível'],
      ['Cobertura da produção inspecionada', pieces ? percent(pieces.inspected, pieces.produced) : 'Indisponível', pieces?.inspected, pieces?.produced],
      ['Postes com algum defeito / produzidos', pieces ? percent(pieces.affected, pieces.produced) : 'Indisponível', pieces?.affected, pieces?.produced],
      ['Postes com defeito crítico / produzidos', pieces ? percent(pieces.critical, pieces.produced) : 'Indisponível', pieces?.critical, pieces?.produced],
      ['Postes somente com defeitos não críticos', pieces?.noncritical_only ?? 'Indisponível'],
      ['Base por peça: fabricação no período; histórico e reinspeções vinculados; cada poste conta uma vez. Situação atual e busca filtram a base.'],
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
      [], ['Defeitos informados sem vinculo com inspecao'],
      ['Ocorrencias recebidas', number(latest.metrics.reported?.total)],
      ['Nao incluidos em FPY, postes nao conformes ou taxas por poste'],
      ['Tipo de defeito', 'Ocorrencias'],
      ...(latest.metrics.reported?.by_type || []).map(item => [item.type, item.count]),
      [], ['Por modelo'], ['Modelo', 'Ocorrencias'],
      ...(latest.metrics.reported?.by_model || []).map(item => [item.model, item.count]),
      [], ['Por dia'], ['Data', 'Ocorrencias'],
      ...(latest.metrics.reported?.by_day || []).map(item => [item.day, item.count]),
      [], ['Indicadores legados preservados'],
      ['Producao (legado)', number(data.kpis?.producao)],
      ['Postes avaliados (legado)', number(data.kpis?.postes)],
      ['Ocorrencias de NC (checklist concluido)', number(data.kpis?.total_erros)],
      ['Oportunidades avaliadas (legado)', number(data.kpis?.total_possivel)],
      ['Postes reprovados (legado)', number(data.kpis?.postes_reprovados)],
      ['Retrabalho (legado)', number(data.kpis?.retrabalho)],
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
