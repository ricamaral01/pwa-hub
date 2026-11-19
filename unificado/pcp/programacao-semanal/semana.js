/* Programação semanal S1/S2. A API confirma todos os valores ao salvar/publicar. */
(() => {
  'use strict';
  const user = requireAuth();
  if (!user) return;
  document.getElementById('user-nome-top').textContent = user.nome || '';
  initSidebar('programacao-semanal');
  const canWrite = ['ADMIN', 'PCP'].includes(user.nivel_acesso);
  const $ = id => document.getElementById(id);
  const nf0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});
  const nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const nf3 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 3, maximumFractionDigits: 3});
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const productSequence = [
    ['943','Padrão Completo 2 cx VR'], ['930','Poste Econômico 1CX VL'],
    ['938','Padrão Completo 1 cx VR'], ['935','Padrão Completo 1 cx VL'],
    ['931','Poste Econômico 1CX VR'], ['932','Poste Econômico 2CX VR'],
    ['933','Poste Econômico 3CX VR'], ['936','Poste 7,5 x 600 VL'],
    ['939','Poste 7,5 x 600 VR'], ['941','Padrão Completo 2 cx VL'],
    ['945','Padrão Completo 3 cx VL'], ['946','Padrão Completo 3 cx VR'],
    ['947','Padrão Completo 4 cx VL'], ['948','Padrão Completo 4 cx VR'],
    ['944','Poste 2 cx VR (7,5 x 300)'], ['942','Poste 2 cx VL (7,5 x 300)'],
    ['949','Poste Subterrâneo 100 A'], ['957','Padrão Completo 1 cx VL (EDP)'],
    ['937','Poste 7,5 x 600 VL c/ TC'], ['940','Poste 7,5 x 600 VR c/ TC'],
    ['4031','Padrão Completo 1 cx VR Elektro'], ['4032','Padrão Completo 2 cx VR Elektro'],
    ['4764','Padrão Completo 1 cx VL Elektro'], ['13570','Poste Totem'],
    ['934','Poste Visor Aéreo 1 cx VL (7,5x300) - CPFL'],
    ['15351','Poste Visor Aéreo 1 cx VL (7,5x300) - ELEKTRO'],
    ['952','Padrão Cemig 1CX - 5,0 x 150'], ['953','Padrão Cemig 1 cx VL - 7,0 x 150'],
    ['954','Padrão Cemig 2 cx VL - 7,0 x 150'], ['4765','Padrão Completo 2 cx VL Elektro'],
    ['4848','Poste Subterrâneo 100 A - Elektro'], ['4929','Padrão Completo 3cxs VL Elektro'],
    ['5017','Poste Subterrâneo 200 A - TC'],
  ];
  const state = {weekStart: '', data: null, items: new Map(), originalItems: new Map(), days: [], originalDays: new Map(), mod: 13, safety: 5, originalMod: 13, originalSafety: 5, dirtyItems: new Set(), dirtyDays: new Set(), loading: false};

  function html(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function dateObj(iso) { return new Date(`${iso}T12:00:00Z`); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function plus(isoDay, n) { const d = dateObj(isoDay); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function monday(isoDay) { const d = dateObj(isoDay); const n = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - n); return iso(d); }
  function labelDate(isoDay) { return isoDay ? `${isoDay.slice(8,10)}/${isoDay.slice(5,7)}/${isoDay.slice(0,4)}` : '—'; }
  function isoWeek(start) { const d = dateObj(start); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const year = d.getUTCFullYear(); const first = new Date(Date.UTC(year,0,1)); return Math.ceil((((d-first)/86400000)+1)/7); }
  function shortDate(isoDay) { return isoDay ? `${isoDay.slice(8,10)}/${isoDay.slice(5,7)}` : '—'; }
  function key(day, sector, product) { return `${day}|${sector}|${product}`; }
  function number(v) { return Number(v || 0); }
  function fmt(v, digits = 0) { return (digits === 3 ? nf3 : digits === 2 ? nf2 : nf0).format(number(v)); }
  function currentWeek() { return state.data?.semana; }
  function editable() { return canWrite && currentWeek()?.status === 'rascunho'; }
  function dirty() { return state.dirtyItems.size > 0 || state.dirtyDays.size > 0 || state.mod !== state.originalMod || state.safety !== state.originalSafety; }
  function dateIndex(day) { return Math.round((dateObj(day) - dateObj(state.weekStart)) / 86400000); }
  function products() { return (state.data?.setores || []).flatMap(s => s.produtos || []); }
  function displayCode(p) { return String(p.codigo || '').toUpperCase() === 'PLE' ? '15351' : String(p.codigo || ''); }
  function orderedRows() {
    const grouped = new Map();
    for (const product of products()) {
      const code = displayCode(product);
      if (!grouped.has(code)) grouped.set(code, []);
      grouped.get(code).push(product);
    }
    const rows = [];
    for (const [code, name] of productSequence) {
      const matches = grouped.get(code) || [];
      if (matches.length) rows.push(...matches.sort((a,b) => a.setor_id - b.setor_id));
      else rows.push({codigo: code, nome: name, referenceOnly: true});
      grouped.delete(code);
    }
    for (const matches of grouped.values()) rows.push(...matches.sort((a,b) => a.setor_id - b.setor_id));
    return rows;
  }
  function productsById() { return new Map(products().map(p => [Number(p.id), p])); }
  function qty(day, sector, product) { return state.items.get(key(day, sector, product)) || 0; }
  function dayOpen(day) { const d = state.days.find(row => row.data === day); return !!(d && d.produz && !d.travado); }
  function totalForProduct(product) { return state.days.reduce((sum, d) => sum + qty(d.data, product.setor_id, product.id), 0); }

  async function request(method, path, body) {
    const headers = {'X-Unificado-Screen':'programacaoSemanal12'};
    const token = API.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch('/unificado/pcp' + path, {method, headers, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)});
    if (response.status === 401) { API.clearSession(); location.href = '/unificado/login.html'; throw new Error('Sessão encerrada'); }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(typeof payload.detail === 'string' ? payload.detail : `Operação recusada (HTTP ${response.status})`); error.status = response.status; error.detail = payload.detail; throw error; }
    return payload;
  }
  function errorMessage(error) {
    if (error.detail?.celulas_recusadas?.length) return `${error.detail.celulas_recusadas.length} célula(s) recusada(s): ${error.detail.celulas_recusadas.map(x => `${shortDate(x.data)} ${x.motivo}`).join(', ')}`;
    if (error.detail?.bloqueios?.length) return `${error.detail.bloqueios.length} bloqueio(s): ${error.detail.bloqueios[0].detalhe}`;
    return error.message || 'Não foi possível concluir a operação';
  }
  function busy(on) { state.loading = on; $('weekly-page').setAttribute('aria-busy', String(on)); }
  function canLeave() { return !dirty() || confirm('Há alterações não salvas nesta semana. Deseja descartá-las?'); }
  window.addEventListener('beforeunload', event => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } });

  async function load(start = state.weekStart) {
    busy(true);
    try {
      const data = await request('GET', `/api/programacao-semanal?semana=${encodeURIComponent(start)}`);
      state.weekStart = start;
      state.data = data;
      state.days = (data.dias || []).map(d => ({...d}));
      state.originalDays = new Map(state.days.map(d => [d.data, {produz: d.produz, mod_prevista: number(d.mod_prevista)}]));
      state.items = new Map((data.itens || []).map(i => [key(i.data, i.setor_id, i.produto_id), number(i.quantidade)]));
      state.originalItems = new Map(state.items);
      state.mod = number(data.semana?.mod_padrao || 13);
      state.safety = number(data.semana?.estoque_seg_dias ?? 5);
      state.originalMod = state.mod;
      state.originalSafety = state.safety;
      state.dirtyItems.clear(); state.dirtyDays.clear();
      $('mega-date').value = data.mega_base?.data || start;
      const url = new URL(location.href); url.searchParams.set('semana', start); history.replaceState(null, '', url);
      render();
    } catch (error) { showToast(errorMessage(error), 'error', 7000); }
    finally { busy(false); }
  }

  function setQty(day, sector, product, value) {
    const k = key(day, sector, product);
    const next = Math.max(0, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);
    state.items.set(k, next);
    if (next === (state.originalItems.get(k) || 0)) state.dirtyItems.delete(k); else state.dirtyItems.add(k);
  }
  function setDayDirty(day) {
    const current = state.days.find(d => d.data === day);
    const original = state.originalDays.get(day);
    if (original && current.produz === original.produz && number(current.mod_prevista) === original.mod_prevista) state.dirtyDays.delete(day);
    else state.dirtyDays.add(day);
  }
  function localIndicators() {
    const all = products();
    const byId = productsById();
    const forms = (state.data?.setores || []).reduce((n, s) => n + number(s.formas_total), 0);
    const days = state.days.map(d => {
      let postes = 0, volume = 0, weight = 0;
      for (const p of all) { const q = qty(d.data, p.setor_id, p.id); postes += q; volume += q * number(p.vol_unit); weight += q * number(p.peso_unit_kg); }
      const mod = d.produz ? number(d.mod_prevista) : 0;
      return {data: d.data, postes, volume, weight, mod, postsPer: mod ? postes / mod : null, kgPer: mod ? weight / mod : null, occupancy: d.produz && forms ? postes / forms : null};
    });
    const postes = days.reduce((s, d) => s + d.postes, 0), volume = days.reduce((s, d) => s + d.volume, 0), weight = days.reduce((s, d) => s + d.weight, 0), mod = days.reduce((s, d) => s + d.mod, 0);
    const negative = all.filter(p => number(p.saldo) + totalForProduct(p) < 0).length;
    let blocks = 0;
    for (const d of state.days) {
      let pl = 0, plLimit = 0;
      for (const p of all) {
        const q = qty(d.data, p.setor_id, p.id);
        if (q > number(p.formas) || (!d.produz && q > 0)) blocks++;
        if (p.grupo_formas === 'PL') { pl += q; plLimit = number(p.formas); }
      }
      if (d.produz && number(d.mod_prevista) <= 0) blocks++;
      if (pl > plLimit) blocks++;
    }
    return {days, postes, volume, weight, mod, forms, negative, blocks, peak: Math.max(0, ...days.map(d => d.volume)), occupancy: forms && days.some(d => state.days.find(x => x.data === d.data)?.produz) ? postes / (forms * state.days.filter(d => d.produz).length) : null, byId};
  }

  function renderHeader() {
    const w = currentWeek(), start = state.weekStart, end = plus(start, 4);
    const weekNo = isoWeek(start);
    $('week-label').textContent = `Sem. ${String(weekNo).padStart(2, '0')} · ${shortDate(start)} a ${labelDate(end)}`;
    const chip = $('status-chip');
    chip.className = 'status-chip ' + (dirty() ? 'dirty' : !w ? 'empty' : w.status === 'rascunho' ? '' : 'published');
    chip.textContent = dirty() ? 'Alterações não salvas' : !w ? 'Sem programação' : w.status === 'rascunho' ? `Rascunho v${w.versao}` : `Publicada v${w.versao} · em execução`;
    const published = state.data?.publicada_atual;
    $('published-meta').textContent = published ? `Última publicada: v${published.versao} em ${new Date(published.publicado_em).toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} por ${published.publicado_por_nome || 'PCP'}` : 'Última publicada: —';
    $('create-week').hidden = !canWrite || !!w;
    $('create-review').hidden = !canWrite || !w || w.status !== 'publicada';
    $('save-draft').hidden = !editable();
    $('publish-week').hidden = !editable();
    $('save-draft').disabled = !dirty();
    $('mega-meta').textContent = `${state.data?.mega_base?.arquivo || 'Relatório importado'} · ${labelDate(state.data?.mega_base?.data)} · ${fmt(state.data?.mega_base?.itens_lidos)} itens lidos`;
    $('mod-value').textContent = fmt(state.mod); $('safety-value').textContent = fmt(state.safety);
    document.querySelectorAll('.weekly-edit').forEach(el => { if (!canWrite) el.hidden = true; });
    document.querySelectorAll('.weekly-actions .weekly-edit button').forEach(button => { button.disabled = !editable() && button.id !== 'copy-prior'; });
    if (!canWrite && !$('readonly-note')) { const note = document.createElement('div'); note.id = 'readonly-note'; note.className = 'readonly-banner'; note.textContent = 'Modo de consulta: esta conta pode acompanhar a programação, sem alterar ou publicar.'; $('weekly-page').prepend(note); }
  }
  function renderMetrics() {
    const m = localIndicators(), produced = state.days.filter(d => d.produz).length || 1;
    const cards = [
      ['Postes programados', fmt(m.postes), 'Setores 1 e 2', ''],
      ['Volume de concreto', `${fmt(m.volume,3)} m³`, `${fmt(m.volume / produced,3)} m³ por dia`, ''],
      ['Dia mais cheio', `${fmt(m.peak,3)} m³`, 'Volume informativo', ''],
      ['Ocupação das formas', m.occupancy == null ? '—' : `${fmt(m.occupancy * 100,2)}%`, `${fmt(m.forms)} formas ativas`, ''],
      ['Postes / homem', m.mod ? fmt(m.postes / m.mod,2) : '—', `${fmt(m.mod)} homens-dia`, 'good'],
      ['kg / homem', m.mod ? fmt(m.weight / m.mod,2) : '—', `${fmt(m.weight)} kg previstos`, 'good'],
      ['Saldo projetado negativo', fmt(m.negative), 'Produto(s) abaixo de zero', m.negative ? 'warn' : ''],
      ['Bloqueios para publicar', fmt(m.blocks), 'Validação final pela API', m.blocks ? 'bad' : 'good'],
    ];
    $('metric-grid').innerHTML = cards.map(([label,value,sub,klass]) => `<div class="metric-card ${klass}"><div class="metric-label">${html(label)}</div><div class="metric-value">${html(value)}</div><div class="metric-sub">${html(sub)}</div></div>`).join('');
  }
  function renderForecast() {
    const m = localIndicators();
    $('forecast-table').querySelector('thead').innerHTML = `<tr><th>Indicador</th>${state.days.map((d,i) => `<th>${dayNames[i]} ${shortDate(d.data)}${d.travado ? ' ' : !d.produz ? ' · Sem produção' : ''}</th>`).join('')}<th>Semana</th></tr>`;
    const rows = [
      ['Concreto S1+S2 (m³)', d => fmt(d.volume,3), fmt(m.volume,3)],
      ['MOD (pessoas)', (d,i) => { const day = state.days[i]; return editable() && day.produz && !day.travado ? `<input type="number" min="1" step="1" class="${number(day.mod_prevista) !== state.mod ? 'custom' : ''}" data-mod-day="${day.data}" value="${number(day.mod_prevista)}" aria-label="MOD ${dayNames[i]} ${labelDate(day.data)}">` : fmt(day.produz ? day.mod_prevista : 0); }, fmt(m.mod)],
      ['Postes', d => fmt(d.postes), fmt(m.postes)],
      ['Peso produzido (kg)', d => fmt(d.weight), fmt(m.weight)],
      ['Postes / homem', d => d.postsPer == null ? '—' : fmt(d.postsPer,2), m.mod ? fmt(m.postes / m.mod,2) : '—'],
      ['kg / homem', d => d.kgPer == null ? '—' : fmt(d.kgPer,2), m.mod ? fmt(m.weight / m.mod,2) : '—'],
    ];
    $('forecast-table').querySelector('tbody').innerHTML = rows.map(([name,cell,week]) => `<tr><td>${html(name)}</td>${m.days.map((d,i) => `<td>${typeof cell === 'function' ? cell(d,i) : cell}</td>`).join('')}<td>${html(week)}</td></tr>`).join('');
  }
  function gridTotals() {
    const all = products();
    const perDay = state.days.map(day => {
      let count = 0, volume = 0;
      for (const p of all) { const q = qty(day.data, p.setor_id, p.id); count += q; volume += q * number(p.vol_unit); }
      return {count, volume};
    });
    return {perDay, count: perDay.reduce((n,x) => n+x.count,0), volume: perDay.reduce((n,x) => n+x.volume,0), forms: (state.data?.setores || []).reduce((n,s) => n + number(s.formas_total),0)};
  }
  function rowMarkup(p) {
    const code = displayCode(p);
    if (p.referenceOnly) return `<tr class="reference-row" data-reference-code="${html(code)}"><td class="col-code sticky-code left"><span class="code-tag">${html(code)}</span></td><td class="col-name sticky-name left product-name"><strong>${html(p.nome)}</strong><small>Setor 4 · somente referência</small></td><td class="col-sector">4</td>${Array(6).fill('<td class="col-num">—</td>').join('')}${state.days.map(() => '<td class="col-day">—</td>').join('')}<td class="col-total">—</td><td class="col-num">—</td><td class="col-num">—</td></tr>`;
    const all = totalForProduct(p), projected = number(p.saldo) + all;
    const days = state.days.map((d,i) => {
      const q = qty(d.data,p.setor_id,p.id), blocked = d.travado || !d.produz, over = q > number(p.formas);
      return `<td class="col-day ${d.travado ? 'locked-cell' : !d.produz ? 'stopped-cell' : ''} ${over ? 'over-cell' : ''}" data-cell="${d.data}|${p.setor_id}|${p.id}"><input type="number" min="0" step="1" inputmode="numeric" data-qty="${d.data}|${p.setor_id}|${p.id}" value="${q}" aria-label="${html(code || p.nome)} ${dayNames[i]} ${labelDate(d.data)}" ${!editable() || blocked ? 'disabled' : ''}></td>`;
    }).join('');
    return `<tr data-product="${p.id}" data-sector="${p.setor_id}"><td class="col-code sticky-code left"><span class="code-tag">${html(code || '—')}</span></td><td class="col-name sticky-name left product-name"><strong>${html(p.nome)}</strong><small>Setor ${p.setor_id} · ${html(`Cód. ${code}`)}</small>${p.grupo_formas === 'PL' ? '<span class="shared-tag">formas PL compartilhadas</span>' : ''}</td><td class="col-sector">${p.setor_id}</td><td class="col-num">${fmt(p.formas)}</td><td class="col-num">${fmt(p.estoque)}</td><td class="col-num">${fmt(p.reserva)}</td><td class="col-num">${fmt(p.carteira)}</td><td class="col-num ${number(p.saldo) < 0 ? 'negative' : ''}">${fmt(p.saldo)}</td><td class="col-num">${fmt(p.prod_diaria_mega)}</td>${days}<td class="col-total" data-total="${p.setor_id}|${p.id}">${fmt(all)}</td><td class="col-num ${projected < 0 ? 'negative' : ''}" data-projected="${p.setor_id}|${p.id}">${fmt(projected)}</td><td class="col-num" data-volume="${p.setor_id}|${p.id}">${fmt(all * number(p.vol_unit),3)}</td></tr>`;
  }
  function footerMarkup(label,values,total) {
    return `<tr><td colspan="9" class="tfoot-label sticky-code">${label}</td>${values.map((value,i) => `<td data-foot="${label}|${i}">${value}</td>`).join('')}<td colspan="3" data-foot-total="${label}">${total}</td></tr>`;
  }
  function renderSectors() {
    const totals = gridTotals();
    const dayHeads = state.days.map((d,i) => `<th class="col-day"><div class="day-head"><span>${dayNames[i]} ${shortDate(d.data)}</span><button type="button" class="day-state ${d.travado ? 'lock' : !d.produz ? 'stop' : ''}" data-toggle-day="${d.data}" ${!editable() || d.travado ? 'disabled' : ''} aria-label="${d.travado ? 'Apontado' : d.produz ? 'Produz' : 'Sem produção'} ${labelDate(d.data)}">${d.travado ? ' Apontado' : d.produz ? 'Produz' : 'Sem produção'}</button></div></th>`).join('');
    const days = Math.max(1,state.days.filter(d => d.produz).length);
    $('sector-sections').innerHTML = `<section class="section-card sector-card"><div class="section-heading"><div><h2>Setores 1 e 2 · sequência única</h2><p class="grid-note">Códigos 952, 953 e 954 pertencem ao Setor 4 e aparecem apenas como referência, sem lançamento.</p></div><div class="sector-summary" id="weekly-grid-summary"><span>${fmt(totals.forms)} formas ativas</span><span>${fmt(totals.count)} postes</span><span>${fmt(totals.volume,3)} m³</span></div></div><div class="sector-table-wrap" tabindex="0" aria-label="Grade única dos setores 1 e 2; role horizontalmente para ver todos os dias"><table class="sector-table"><thead><tr><th class="col-code sticky-code left">Cód.</th><th class="col-name sticky-name left">Poste</th><th class="col-sector">Setor</th><th class="col-num">Formas</th><th class="col-num">Estoque</th><th class="col-num">Reserva</th><th class="col-num">Carteira</th><th class="col-num">Saldo</th><th class="col-num">Prod./dia Mega</th>${dayHeads}<th class="col-total">Total</th><th class="col-num">Saldo proj.</th><th class="col-num">m³</th></tr></thead><tbody>${orderedRows().map(rowMarkup).join('')}</tbody><tfoot>${footerMarkup('Postes programados',totals.perDay.map(d => fmt(d.count)),fmt(totals.count))}${footerMarkup('Volume (m³)',totals.perDay.map(d => fmt(d.volume,3)),fmt(totals.volume,3))}${footerMarkup('Ocupação das formas',totals.perDay.map(d => totals.forms ? `${fmt(d.count/totals.forms*100,2)}%` : '—'),totals.forms ? `${fmt(totals.count/(totals.forms*days)*100,2)}%` : '—')}</tfoot></table></div></section>`;
    refreshOverLimit();
  }
  function refreshOverLimit() {
    const byId = productsById();
    for (const cell of document.querySelectorAll('[data-cell]')) {
      const [day,sid,pid] = cell.dataset.cell.split('|'); const p = byId.get(Number(pid));
      let over = qty(day,Number(sid),Number(pid)) > number(p?.formas);
      if (p?.grupo_formas === 'PL') { const pl = products().filter(x => x.grupo_formas === 'PL'); over ||= pl.reduce((sum,x) => sum + qty(day,x.setor_id,x.id),0) > number(p.formas); }
      cell.classList.toggle('over-cell', over);
    }
  }
  function refreshTotals() {
    const totals = gridTotals();
    for (const p of products()) {
      const total = totalForProduct(p), projected = number(p.saldo) + total;
      const totalEl = document.querySelector(`[data-total="${p.setor_id}|${p.id}"]`), projectedEl = document.querySelector(`[data-projected="${p.setor_id}|${p.id}"]`), volumeEl = document.querySelector(`[data-volume="${p.setor_id}|${p.id}"]`);
      if (totalEl) totalEl.textContent = fmt(total);
      if (projectedEl) { projectedEl.textContent = fmt(projected); projectedEl.classList.toggle('negative', projected < 0); }
      if (volumeEl) volumeEl.textContent = fmt(total * number(p.vol_unit),3);
    }
    const summary = $('weekly-grid-summary');
    if (summary) summary.innerHTML = `<span>${fmt(totals.forms)} formas ativas</span><span>${fmt(totals.count)} postes</span><span>${fmt(totals.volume,3)} m³</span>`;
    const days = Math.max(1,state.days.filter(d => d.produz).length);
    const rows = [
      ['Postes programados',totals.perDay.map(d => fmt(d.count)),fmt(totals.count)],
      ['Volume (m³)',totals.perDay.map(d => fmt(d.volume,3)),fmt(totals.volume,3)],
      ['Ocupação das formas',totals.perDay.map(d => totals.forms ? `${fmt(d.count/totals.forms*100,2)}%`:'—'),totals.forms ? `${fmt(totals.count/(totals.forms*days)*100,2)}%`:'—'],
    ];
    for (const [label,values,total] of rows) {
      values.forEach((value,i) => { const el = document.querySelector(`[data-foot="${label}|${i}"]`); if (el) el.textContent = value; });
      const el = document.querySelector(`[data-foot-total="${label}"]`); if (el) el.textContent = total;
    }
  }
  function refreshNumbers() { renderHeader(); renderMetrics(); renderForecast(); refreshTotals(); refreshOverLimit(); }
  function render() { renderHeader(); renderMetrics(); renderForecast(); renderSectors(); }

  async function createDraft(origin = 'vazia') {
    if (!canWrite) return;
    busy(true);
    try { await request('POST', '/api/programacao-semana', {semana_inicio: state.weekStart, origem: origin}); await load(); showToast('Rascunho criado', 'success'); }
    catch (error) { showToast(errorMessage(error), 'error', 6500); }
    finally { busy(false); }
  }
  async function saveDraft(silent = false) {
    if (!editable()) return false;
    if (!dirty()) { if (!silent) showToast('Nenhuma alteração para salvar', 'warning'); return true; }
    busy(true);
    const id = currentWeek().id;
    try {
      if (state.mod !== state.originalMod || state.safety !== state.originalSafety) await request('PUT', `/api/programacao-semana/${id}/parametros`, {mod_padrao: state.mod, estoque_seg_dias: state.safety});
      if (state.dirtyDays.size) await request('PUT', `/api/programacao-semana/${id}/dias`, state.days.filter(d => state.dirtyDays.has(d.data)).map(d => ({data:d.data, produz:d.produz, mod_prevista:number(d.mod_prevista)})));
      const changed = [...state.dirtyItems].map(k => { const [day,sid,pid] = k.split('|'); return {data:day, setor_id:Number(sid), produto_id:Number(pid), quantidade:state.items.get(k) || 0}; }).filter(item => state.days.find(d => d.data === item.data)?.produz);
      if (changed.length) await request('PUT', `/api/programacao-semana/${id}/itens`, changed);
      await load();
      if (!silent) showToast('Rascunho salvo', 'success');
      return true;
    } catch (error) { showToast(errorMessage(error), 'error', 7500); return false; }
    finally { busy(false); }
  }
  function bulkSet(fn) {
    if (!editable()) return;
    for (const d of state.days) if (dayOpen(d.data)) for (const p of products()) setQty(d.data,p.setor_id,p.id,fn(d,p));
    renderSectors(); refreshNumbers();
  }
  async function copyPrior() {
    if (!canWrite) return;
    if (!currentWeek()) { await createDraft('semana_anterior'); return; }
    if (!editable()) return;
    try {
      const prior = await request('GET', `/api/programacao-semanal?semana=${plus(state.weekStart,-7)}`);
      if (!prior.semana) { showToast('Não há programação na semana anterior', 'warning'); return; }
      const previous = new Map((prior.itens || []).map(i => [key(i.data,i.setor_id,i.produto_id),number(i.quantidade)]));
      bulkSet((d,p) => previous.get(key(plus(d.data,-7),p.setor_id,p.id)) || 0);
      showToast('Quantidades copiadas para os dias abertos. Revise antes de salvar.', 'success');
    } catch (error) { showToast(errorMessage(error), 'error'); }
  }
  async function suggest() {
    if (!editable()) return;
    busy(true);
    try {
      const out = await request('POST', `/api/programacao-semana/${currentWeek().id}/sugerir`, {estoque_seg_dias:state.safety});
      const proposed = new Map((out.itens || []).map(i => [key(i.data,i.setor_id,i.produto_id),number(i.quantidade)]));
      bulkSet((d,p) => proposed.get(key(d.data,p.setor_id,p.id)) || 0);
      showToast('Sugestão aplicada à grade. Confira e salve o rascunho.', 'success');
    } catch (error) { showToast(errorMessage(error), 'error', 6500); }
    finally { busy(false); }
  }
  function describeCheck(item) {
    const day = item.data ? `${shortDate(item.data)} · ` : '';
    return `${item.codigo} · ${day}${item.detalhe || 'Verificar programação'}`;
  }
  async function openDialog() {
    if (!editable()) return;
    if (dirty() && !(await saveDraft(true))) return;
    busy(true);
    try {
      const id = currentWeek().id;
      const [checks, difference] = await Promise.all([
        request('POST', `/api/programacao-semana/${id}/validar`, {}),
        request('GET', `/api/programacao-semana/${id}/diff`),
      ]);
      const m = localIndicators();
      $('publish-title').textContent = `Publicar versão ${currentWeek().versao}`;
      $('dialog-period').textContent = `${labelDate(state.weekStart)} a ${labelDate(plus(state.weekStart,4))} · Setores 1 e 2`;
      $('dialog-cards').innerHTML = [
        ['Postes',fmt(m.postes)],['Concreto',`${fmt(m.volume,3)} m³`],
        ['MOD · postes/homem',`${fmt(m.mod)} · ${m.mod ? fmt(m.postes/m.mod,2) : '—'}`],
        ['Linhas alteradas',fmt(difference.alteracoes?.length)],
      ].map(([name,value])=>`<div><small>${html(name)}</small><strong>${html(value)}</strong></div>`).join('');
      const blocks = checks.bloqueios || [], warnings = checks.avisos || [];
      $('dialog-checks').innerHTML = blocks.length || warnings.length ? [
        ...blocks.map(x=>`<div class="check block">✕ ${html(describeCheck(x))}</div>`),
        ...warnings.map(x=>`<div class="check warning">! ${html(describeCheck(x))}</div>`),
      ].join('') : '<div class="check ok">✓ Sem bloqueios ou avisos para esta versão.</div>';
      const byId = productsById();
      $('diff-body').innerHTML = (difference.alteracoes || []).length ? difference.alteracoes.map(row => `<tr><td>Setor ${row.setor_id}</td><td>${html(byId.get(Number(row.produto_id))?.nome || row.produto_id)}</td><td>${shortDate(row.data)}</td><td>${fmt(row.antes)}</td><td>${fmt(row.agora)}</td><td>${row.diferenca > 0 ? '+' : ''}${fmt(row.diferenca)}</td></tr>`).join('') : '<tr><td colspan="6">Primeira versão ou nenhuma quantidade alterada.</td></tr>';
      $('reason-required').textContent = currentWeek().versao > 1 ? '(obrigatório)' : '(opcional)';
      $('publish-reason').required = currentWeek().versao > 1;
      $('publish-reason').value = '';
      $('notify-production').checked = false;
      $('confirm-publish').disabled = !!blocks.length;
      $('confirm-publish').textContent = `Publicar versão ${currentWeek().versao}`;
      $('publish-dialog').showModal();
    } catch (error) { showToast(errorMessage(error), 'error', 6500); }
    finally { busy(false); }
  }
  async function confirmPublish() {
    const reason = $('publish-reason').value.trim();
    if (currentWeek()?.versao > 1 && !reason) { $('publish-reason').focus(); showToast('Informe o motivo da revisão', 'warning'); return; }
    $('confirm-publish').disabled = true;
    try {
      const result = await request('POST', `/api/programacao-semana/${currentWeek().id}/publicar`, {motivo:reason || null, avisar_producao:$('notify-production').checked});
      $('publish-dialog').close();
      await load();
      showToast(result.aviso_producao === 'disponivel_unificado' ? 'Semana publicada. O aviso está disponível nos setores 1 e 2 do Unificado.' : 'Semana publicada com sucesso', 'success', 7000);
    } catch (error) { showToast(errorMessage(error), 'error', 8000); $('confirm-publish').disabled = false; }
  }
  async function reimportMega(file) {
    if (!file || !canWrite) return;
    if (!/\.(xls|xlsx|csv)$/i.test(file.name)) { showToast('Selecione XLS, XLSX ou CSV', 'warning'); return; }
    const form = new FormData();
    form.append('data', $('mega-date').value || state.weekStart);
    form.append('substituir', 'true');
    form.append('file', file);
    try { const out = await request('POST', '/api/programacao-alex/importar-mega', form); await load(); showToast(`${out.importados} itens Mega importados; ${out.ignorados} linhas vazias ignoradas`, 'success'); }
    catch (error) { showToast(errorMessage(error), 'error', 7000); }
    finally { $('mega-file').value = ''; }
  }

  $('prev-week').addEventListener('click', () => { if (canLeave()) load(plus(state.weekStart,-7)); });
  $('next-week').addEventListener('click', () => { if (canLeave()) load(plus(state.weekStart,7)); });
  $('create-week').addEventListener('click', () => createDraft('vazia'));
  $('create-review').addEventListener('click', () => createDraft('publicada'));
  $('save-draft').addEventListener('click', () => saveDraft());
  $('publish-week').addEventListener('click', openDialog);
  $('suggest').addEventListener('click', suggest);
  $('copy-prior').addEventListener('click', copyPrior);
  $('clear-open').addEventListener('click', () => bulkSet(() => 0));
  $('repeat-first').addEventListener('click', () => {
    const first = state.days.find(d => dayOpen(d.data));
    if (!first) return showToast('Não há dia aberto', 'warning');
    bulkSet((d,p) => qty(first.data,p.setor_id,p.id));
  });
  $('reimport-mega').addEventListener('click', () => $('mega-file').click());
  $('mega-file').addEventListener('change', event => reimportMega(event.target.files?.[0]));
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    if (!editable()) return;
    const [field,step] = button.dataset.step.split(':');
    if (field === 'mod') { state.mod = Math.max(1,state.mod + Number(step)); state.days.forEach(d => { if (dayOpen(d.data)) { d.mod_prevista = state.mod; setDayDirty(d.data); } }); }
    else state.safety = Math.max(0,state.safety + Number(step));
    refreshNumbers();
  }));
  $('sector-sections').addEventListener('input', event => {
    const input = event.target.closest('[data-qty]'); if (!input || !editable()) return;
    const [day,sid,pid] = input.dataset.qty.split('|');
    setQty(day,Number(sid),Number(pid),input.value);
    refreshNumbers();
  });
  $('sector-sections').addEventListener('change', event => {
    const input = event.target.closest('[data-qty]'); if (!input) return;
    const [day,sid,pid] = input.dataset.qty.split('|'); input.value = qty(day,Number(sid),Number(pid));
  });
  $('sector-sections').addEventListener('click', event => {
    const button = event.target.closest('[data-toggle-day]'); if (!button || !editable()) return;
    const d = state.days.find(item => item.data === button.dataset.toggleDay);
    if (!d || d.travado) return;
    d.produz = !d.produz; setDayDirty(d.data);
    if (!d.produz) for (const p of products()) setQty(d.data,p.setor_id,p.id,0);
    renderSectors(); refreshNumbers();
  });
  $('forecast-table').addEventListener('change', event => {
    const input = event.target.closest('[data-mod-day]'); if (!input || !editable()) return;
    const d = state.days.find(day => day.data === input.dataset.modDay);
    if (!d || d.travado || !d.produz) return;
    d.mod_prevista = Math.max(1,Math.trunc(Number(input.value) || 1)); setDayDirty(d.data);
    refreshNumbers();
  });
  $('close-dialog').addEventListener('click', () => $('publish-dialog').close());
  $('back-to-grid').addEventListener('click', () => $('publish-dialog').close());
  $('confirm-publish').addEventListener('click', confirmPublish);
  $('publish-dialog').addEventListener('click', event => { if (event.target === $('publish-dialog')) $('publish-dialog').close(); });
  const query = new URLSearchParams(location.search).get('semana');
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(query || '') ? monday(query) : monday(todayISO());
  load(initial);
})();
