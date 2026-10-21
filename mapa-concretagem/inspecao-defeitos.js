/* Levantamento de defeitos dos setores 3 e 4. A tabela é a fonte de verdade. */
(() => {
  const DEF = [
    ['D01','Ninho / bicheira superficial','B','Concreto','A'],
    ['D02','Ninho profundo','C','Concreto','O'],
    ['D03','Bolhas / porosidade','B','Concreto','C'],
    ['D04','Quebra de canto / lasca','B','Concreto','J'],
    ['D05','Fissura transversal','C','Fissuras','I'],
    ['D06','Fissura longitudinal','C','Fissuras','I'],
    ['D07','Armadura exposta','C','Armadura','A'],
    ['F01','Rebarba / nata na junta','B','Problemas com forma','Q'],
    ['F02','Degrau ou desalinhamento na junta','B','Problemas com forma','S'],
    ['F03','Falha por vazamento de nata na junta','B','Problemas com forma','O'],
    ['F04','Marca ou amassado da forma','B','Problemas com forma','J'],
    ['F05','Ovalização (seção fora do círculo)','C','Problemas com forma','R'],
    ['D08','Empeno / deformação','C','Geometria','S'],
    ['D09','Dimensão fora da tolerância','C','Geometria','S'],
    ['D10','Furo ou olhal obstruído','B','Acessórios e identificação','E'],
    ['D11','Identificação ilegível','B','Acessórios e identificação','F'],
    ['D99','Outro (descrever)','B','Outros','P']
  ];
  const REG = ['Base','Meio','Topo'];
  const byCode = Object.fromEntries(DEF.map(d => [d[0], d]));
  const $ = id => document.getElementById(id);
  const form = $('insDefForm');
  if (!form) return;
  if (!location.pathname.startsWith('/unificado/mapa/operacao') &&
      !location.pathname.startsWith('/unificado/m/inspecao/') && !window.__insDefTest) {
    $('insDefApp').hidden = true;
    $('insDefProducao').hidden = false;
    return;
  }
  let records = [], counts = {}, editing = null, production = null, classManual = false, loaded = false, deleting = false;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = (a, b) => b ? `${(a * 100 / b).toFixed(1).replace('.', ',')}%` : '—';
  const dec = (a, b) => b ? (a / b).toFixed(2).replace('.', ',') : '—';
  const nfmt = n => new Intl.NumberFormat('pt-BR').format(n);
  const key = (code, region) => `${code}|${region}`;
  // Desenhos vetoriais do mockup original de levantamento de defeitos.
  const pole = '<path class="p" d="M3 10 L29 11.5 L29 20.5 L3 22 Z"/>';
  const defectDrawings = {
    D01:pole+'<circle class="mf" cx="11" cy="14" r="1.1"/><circle class="mf" cx="14" cy="17.5" r="1.1"/><circle class="mf" cx="16.5" cy="14.5" r="1.1"/><circle class="mf" cx="12" cy="19" r="0.9"/><circle class="mf" cx="19" cy="17" r="0.9"/>',
    D02:pole+'<path class="mf" d="M12 13.5q4-2.5 7 0.5q2.5 3-1 5.5q-4 2-6.5-1q-2-3 0.5-5z"/>',
    D03:pole+'<circle class="m" cx="9" cy="15" r="1.4"/><circle class="m" cx="14" cy="18.5" r="1.4"/><circle class="m" cx="19" cy="14.5" r="1.4"/><circle class="m" cx="24" cy="18" r="1.4"/>',
    D04:'<path class="p" d="M3 10 L29 11.5 L29 15.5 L24.5 20.7 L3 22 Z"/><path class="m" d="M29 15.5 L29 20.5 L24.5 20.7" stroke-dasharray="1.6 1.6"/>',
    D05:pole+'<path class="m" d="M16.5 10.5l-1.8 3l2.6 2.2l-2.2 3l1.6 3.3"/>',
    D06:pole+'<path class="m" d="M5 16.5l4-1.6l3 2l4-1.8l3 1.7l4-1.4l3 1"/>',
    D07:pole+'<ellipse class="m" cx="16" cy="16" rx="6.5" ry="3.6"/><path class="m" d="M7 16H25" stroke-width="2.6"/>',
    F01:pole+'<path class="m" d="M5 10.1l1-3.2l1.8 3.3l1.2-2.8l1.8 2.9l1.2-3.3l1.9 3.5"/>',
    F02:'<path class="p" d="M3 10 L16 10.75 L16 8.6 L29 9.4 L29 20.5 L3 22 Z"/><path class="m" d="M16 11.2V8.2"/><path class="m" d="M16 11.2V21" stroke-dasharray="1.6 1.6"/>',
    F03:pole+'<path class="m" d="M4 16H9M24 16H28"/><path class="mf" d="M10 16q2-1.8 4 0q2 1.6 4-0.2q2-1.5 5 0.2q-3 2.3-5 0.8q-2 1.6-4 0.1q-2 1.4-4-0.9z"/>',
    F04:pole+'<path class="m" d="M10 12.5q6 6.5 12 0"/><path class="m" d="M12.5 14.5q3.5 2.6 7 0" opacity=".55"/>',
    F05:'<circle cx="16" cy="16" r="9" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="2 2"/><ellipse class="m" cx="16" cy="16" rx="11.5" ry="7"/>',
    D08:'<path class="p" d="M3 17 Q16 7 29 17 L29 22 Q16 12 3 22 Z"/><path class="m" d="M3 25H29" stroke-dasharray="2 2"/>',
    D09:'<path class="p" d="M3 7 L29 8.5 L29 17.5 L3 19 Z"/><path class="m" d="M4 25H28M3 22.5V27.5M29 22.5V27.5M6 23.2L4 25L6 26.8M26 23.2L28 25L26 26.8"/>',
    D10:pole+'<circle cx="16" cy="16" r="3.6" fill="var(--card)" stroke="var(--muted)" stroke-width="1.2"/><path class="m" d="M13.4 13.4l5.2 5.2M18.6 13.4l-5.2 5.2"/>',
    D11:pole+'<rect x="10.5" y="12.8" width="11" height="6.4" rx="1" fill="var(--card)" stroke="var(--muted)" stroke-width="1.2"/><path class="m" d="M12 16.2q1.2-2.2 2.4 0t2.4 0t2.4 0"/>',
    D99:pole+'<text x="16" y="20" text-anchor="middle" font-size="10" font-weight="700" class="t">?</text>'
  };
  const icon = (code, size = 36) => `<svg class="ins-def-drawing ${byCode[code]?.[2] === 'C' ? 'critical' : 'standard'}" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">${defectDrawings[code] || defectDrawings.D99}</svg>`;
  const source = () => typeof supabaseClient !== 'undefined' ? supabaseClient : null;
  const message = (value, error = false) => { $('insDefMessage').textContent = value; $('insDefMessage').classList.toggle('error', error); $('insDefGlobalStatus').textContent = error ? value : ''; };
  const defects = () => DEF.flatMap(d => REG.map(r => ({codigo:d[0], regiao:r, quantidade:counts[key(d[0],r)] || 0}))).filter(d => d.quantidade);
  const suggested = () => defects().some(d => byCode[d.codigo][2] === 'C') ? 'C' : defects().length ? 'B' : 'A';
  function renderMatrix() {
    const groups = [...new Set(DEF.map(d => d[3]))];
    $('insDefMatrix').innerHTML = groups.map(group => `<section class="ins-def-group"><div class="ins-def-group-title">${escape(group)}</div>
      <div class="ins-def-row ins-def-row-head"><span>Defeito</span>${REG.map(r => `<span>${r}</span>`).join('')}</div>
      ${DEF.filter(d => d[3] === group).map(d => `<div class="ins-def-row"><div class="ins-def-name"><span class="ins-def-icon">${icon(d[0])}</span><span><span class="ins-def-code">${d[0]} · ${d[2]}</span><br>${escape(d[1])}</span></div>
      ${REG.map(r => `<div class="ins-def-stepper" aria-label="${escape(d[1])}, ${r}"><button type="button" data-code="${d[0]}" data-region="${r}" data-step="-1" aria-label="Diminuir ${escape(d[1])} em ${r}">−</button><output>${counts[key(d[0],r)] || 0}</output><button type="button" data-code="${d[0]}" data-region="${r}" data-step="1" aria-label="Adicionar ${escape(d[1])} em ${r}">+</button></div>`).join('')}</div>`).join('')}</section>`).join('');
  }
  function refreshClass() {
    if (!classManual) form.elements.classe.value = suggested();
    $('insDefClasses').title = `Classificação sugerida: ${suggested()}`;
  }
  function reset() {
    form.reset(); counts = {}; editing = null; production = null; classManual = false;
    form.elements.data_desforma.value = typeof todayYmd === 'function' ? todayYmd() : new Date().toLocaleDateString('en-CA');
    $('insDefVinculo').hidden = true; $('insDefSalvar').textContent = 'Salvar inspeção';
    renderMatrix(); refreshClass(); message('');
  }
  function tab(name) {
    $('insDefApp').querySelectorAll('[data-ins-tab]').forEach(b => b.classList.toggle('active', b.dataset.insTab === name));
    ['registrar','analise','postes'].forEach(t => $(`insDef${t[0].toUpperCase()}${t.slice(1)}`).hidden = t !== name);
    $('insDefProducao').hidden = name !== 'producao';
    if (name === 'postes') $('insDefLista').innerHTML = '<p>Carregando postes...</p>';
    if (name === 'analise' || name === 'postes') load().then(() => { renderAnalysis(); renderList(); });
  }
  async function load() {
    const db = source();
    if (!db) { loaded = false; message('Banco de inspeção indisponível.', true); return; }
    const all = [];
    for (let offset = 0; ; offset += 500) {
      const {data,error} = await db.from('inspecao_defeitos').select('*').order('data_desforma', {ascending:false}).range(offset,offset+499);
      if (error) { loaded = false; message(`Não foi possível consultar as inspeções: ${error.message}`, true); return; }
      all.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    records = all; loaded = true; $('insDefGlobalStatus').textContent = '';
  }
  async function save(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const db = source();
    if (!db) { message('Banco de inspeção indisponível.', true); return; }
    const setor = form.elements.setor.value;
    const serie = form.elements.serie.value.trim();
    const tipo = form.elements.tipo.value.trim();
    const forma = form.elements.forma_numero.value.trim();
    if (!serie || !tipo || !forma || !['Setor 3','Setor 4'].includes(setor)) { message('Preencha setor, série, tipo e forma.', true); return; }
    const classe = form.elements.classe.value;
    if ('ABC'.indexOf(classe) < 0) { message('Selecione uma classificação.', true); return; }
    if (classe === 'A' && defects().length) { message('Classe A exige ausência de defeitos. Se o poste for aprovado após reparo, use classe B.', true); return; }
    if (classe === 'B' && suggested() === 'C') { message('Há defeito crítico. Classifique como C.', true); return; }
    if (defects().some(d => d.codigo === 'D99') && !form.elements.observacoes.value.trim()) { message('Descreva o defeito D99 nas observações.', true); return; }
    const payload = {setor, serie, data_desforma:form.elements.data_desforma.value, turno:form.elements.turno.value,
      tipo, forma_numero:forma, classe, observacoes:form.elements.observacoes.value.trim(), defeitos:defects(),
      producao_record_id:production?.recordId || editing?.producao_record_id || null,
      atualizado_em:new Date().toISOString()};
    $('insDefSalvar').disabled = true; message('Salvando...');
    try {
      const query = editing ? db.from('inspecao_defeitos').update(payload).eq('id', editing.id) : db.from('inspecao_defeitos').insert(payload);
      const {error} = await query;
      if (error) throw error;
      reset(); await load(); message('Inspeção salva no banco.'); renderAnalysis(); renderList();
    } catch (error) {
      message(error.code === '23505' ? 'Já existe uma inspeção para essa série nesse setor.' : `Erro ao salvar: ${error.message || error}`, true);
    } finally { $('insDefSalvar').disabled = false; }
  }
  function edit(row) {
    editing = row; production = null; form.reset();
    for (const field of ['setor','serie','data_desforma','turno','tipo','forma_numero','classe','observacoes']) form.elements[field].value = row[field] || '';
    counts = Object.fromEntries((row.defeitos || []).map(d => [key(d.codigo,d.regiao), d.quantidade]));
    classManual = true; renderMatrix(); refreshClass();
    $('insDefVinculo').hidden = !row.producao_record_id;
    $('insDefVinculo').textContent = row.producao_record_id ? 'Vinculado ao poste produzido.' : '';
    $('insDefSalvar').textContent = 'Atualizar inspeção'; message(''); tab('registrar');
    $('insDefForm').scrollIntoView({block:'start',behavior:'smooth'});
  }
  window.insDefeitosSelecionarPoste = poste => {
    reset(); production = poste;
    form.elements.setor.value = poste.setor;
    form.elements.tipo.value = poste.modelo || poste.descricaoPoste || '';
    form.elements.forma_numero.value = poste.formaNumero || '';
    $('insDefVinculo').hidden = false;
    $('insDefVinculo').textContent = `Produção vinculada: ${poste.setor} · forma ${poste.formaNumero} · ${poste.modelo || ''}. Informe o nº de série e confira a data da desforma.`;
    tab('registrar'); form.elements.serie.focus();
  };
  const filtered = () => records.filter(r => (! $('insDefDe').value || r.data_desforma >= $('insDefDe').value) &&
    (! $('insDefAte').value || r.data_desforma <= $('insDefAte').value) &&
    (! $('insDefSetorFiltro').value || r.setor === $('insDefSetorFiltro').value) &&
    (! $('insDefTurnoFiltro').value || r.turno === $('insDefTurnoFiltro').value));
  const table = (heads, rows) => rows.length ? `<table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p>Nenhum registro para os filtros selecionados.</p>';
  function paretoChart(list, total) {
    if (!list.length) return '<p>Nenhum defeito no período.</p>';
    const w=680, h=260, left=38, right=42, top=20, bottom=42;
    const innerW=w-left-right, innerH=h-top-bottom, max=Math.max(...list.map(([,q]) => q));
    let cumulative=0;
    const points=list.map(([code,q],i) => {
      cumulative += q;
      return [left+(i+.5)*innerW/list.length, top+innerH*(1-cumulative/total)];
    });
    const grid=[0,.25,.5,.75,1].map(p => `<line x1="${left}" x2="${w-right}" y1="${top+innerH*(1-p)}" y2="${top+innerH*(1-p)}" stroke="#d8e1ec"/><text x="${left-5}" y="${top+innerH*(1-p)+4}" text-anchor="end" font-size="10" fill="#5a6a7e">${Math.round(max*p)}</text>`).join('');
    const bars=list.map(([code,q],i) => {
      const barW=innerW/list.length, barH=innerH*q/max, x=left+i*barW+barW*.16;
      return `<rect x="${x}" y="${top+innerH-barH}" width="${barW*.68}" height="${barH}" rx="3" fill="#e8762a"><title>${escape(code)}: ${q}</title></rect><text x="${left+(i+.5)*barW}" y="${h-bottom+17}" text-anchor="middle" font-size="10" fill="#1a3a5c">${escape(code)}</text>`;
    }).join('');
    return `<svg class="ins-def-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Pareto de defeitos: barras de ocorrências e linha de percentual acumulado">${grid}${bars}<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#1a3a5c" stroke-width="2"/>${points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#1a3a5c"/>`).join('')}</svg>`;
  }
  function renderAnalysis() {
    if (!loaded) return;
    const rows = filtered(), n = rows.length, allDef = rows.flatMap(r => r.defeitos || []), total = allDef.reduce((s,d) => s + d.quantidade,0);
    const countClass = c => rows.filter(r => r.classe === c).length;
    $('insDefKpis').innerHTML = [['Postes',n],['FPY',pct(countClass('A'),n)],['DPU',dec(total,n)],['Reparo B',pct(countClass('B'),n)],['Crítico C',pct(countClass('C'),n)]].map(([label,value]) => `<div class="ins-def-kpi"><span>${label}</span><strong>${value}</strong></div>`).join('');
    const count = (items, keyOf) => { const map = new Map(); items.forEach(d => map.set(keyOf(d),(map.get(keyOf(d)) || 0)+d.quantidade)); return [...map].sort((a,b) => b[1]-a[1]); };
    let cumulative = 0;
    const pareto = count(allDef,d => d.codigo);
    $('insDefParetoChart').innerHTML = paretoChart(pareto,total);
    $('insDefPareto').innerHTML = table(['Código','Defeito','Ocorrências','% acumulado'], pareto.map(([code,q]) => { cumulative += q; return [`<span class="ins-def-inline-code">${icon(code,28)}${escape(code)}</span>`,escape(byCode[code]?.[1] || code),nfmt(q),pct(cumulative,total)]; }));
    const heatMax = Math.max(1,...pareto.map(([code]) => Math.max(...REG.map(reg => allDef.filter(d => d.codigo === code && d.regiao === reg).reduce((s,d) => s+d.quantidade,0)))));
    $('insDefHeat').innerHTML = table(['Defeito','Base','Meio','Topo'], pareto.map(([code]) => [`<span class="ins-def-inline-code">${icon(code,28)}${escape(code)}</span>`,...REG.map(reg => { const value=allDef.filter(d => d.codigo === code && d.regiao === reg).reduce((s,d) => s+d.quantidade,0); return `<span class="ins-def-heat" style="background:rgba(232,118,42,${(value/heatMax*.5).toFixed(2)})">${nfmt(value)}</span>`; })]));
    const groupRows = (field) => { const groups = {};
      rows.forEach(r => { const name = r[field] || '—'; (groups[name] ||= []).push(r); });
      return Object.entries(groups).map(([name,rs]) => [escape(name),rs.length,pct(rs.filter(r => r.classe === 'A').length,rs.length),dec(rs.flatMap(r => r.defeitos || []).reduce((s,d) => s+d.quantidade,0),rs.length),rs.filter(r => r.classe === 'B').length,rs.filter(r => r.classe === 'C').length]).sort((a,b) => b[1]-a[1]); };
    $('insDefForma').innerHTML = table(['Forma','Postes','FPY','DPU','B','C'],groupRows('forma_numero'));
    $('insDefDia').innerHTML = table(['Data','Postes','FPY','DPU','B','C'],groupRows('data_desforma'));
    $('insDefGrupo').innerHTML = table(['Grupo de causa','Ocorrências','% do total'],count(allDef,d => byCode[d.codigo]?.[3] || 'Outros').map(([name,q]) => [escape(name),nfmt(q),pct(q,total)]));
  }
  function renderList() {
    if (!loaded) return;
    const q = $('insDefBusca').value.trim().toLocaleLowerCase('pt-BR');
    const rows = records.filter(r => !q || [r.serie,r.forma_numero,r.tipo,...(r.defeitos || []).map(d => `${d.codigo} ${byCode[d.codigo]?.[1] || ''}`)].join(' ').toLocaleLowerCase('pt-BR').includes(q));
    $('insDefLista').innerHTML = rows.length ? rows.map(r => `<article class="ins-def-list-item"><div class="ins-def-badge ${r.classe}">${escape(r.classe)}</div><div><strong>${escape(r.serie)}</strong><p>${escape(r.setor)} · ${escape(r.data_desforma)} · turno ${escape(r.turno)} · ${escape(r.tipo)} · forma ${escape(r.forma_numero)}</p><p class="ins-def-list-drawings">${(r.defeitos || []).map(d => `<span>${icon(d.codigo,22)}${escape(d.codigo)} ${escape(d.regiao)} ×${d.quantidade}</span>`).join('') || 'Sem defeito'}</p></div><div class="ins-def-list-actions"><button type="button" class="btn" data-edit="${escape(r.id)}">Editar</button><button type="button" class="btn" data-delete="${escape(r.id)}">Apagar</button></div></article>`).join('') : '<p>Nenhum poste encontrado.</p>';
  }
  function exportCsv() {
    const header = ['Setor','Série','Data da desforma','Turno','Tipo','Forma','Classe','Código','Região','Quantidade','Observações'];
    const lines = [header, ...filtered().flatMap(r => (r.defeitos?.length ? r.defeitos : [{codigo:'',regiao:'',quantidade:0}]).map(d => [r.setor,r.serie,r.data_desforma,r.turno,r.tipo,r.forma_numero,r.classe,d.codigo,d.regiao,d.quantidade,r.observacoes]))];
    const csv = '\ufeff' + lines.map(row => row.map(value => `"${String(value ?? '').replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); link.download = 'inspecao-defeitos-s3-s4.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href),1000);
  }
  $('insDefMatrix').addEventListener('click', event => {
    const button = event.target.closest('button[data-step]'); if (!button) return;
    const k = key(button.dataset.code,button.dataset.region);
    counts[k] = Math.max(0,Math.min(999,(counts[k] || 0)+Number(button.dataset.step)));
    button.parentElement.querySelector('output').textContent = counts[k]; refreshClass();
  });
  $('insDefApp').querySelector('.ins-def-tabs').addEventListener('click', event => { const button = event.target.closest('[data-ins-tab]'); if (button) tab(button.dataset.insTab); });
  $('insDefClasses').addEventListener('change', () => { classManual = true; });
  $('insDefLimpar').addEventListener('click',reset);
  form.addEventListener('submit',save);
  ['insDefDe','insDefAte','insDefSetorFiltro','insDefTurnoFiltro'].forEach(id => $(id).addEventListener('change',renderAnalysis));
  $('insDefBusca').addEventListener('input',renderList);
  $('insDefCsv').addEventListener('click',exportCsv);
  $('insDefLista').addEventListener('click',async event => {
    if (deleting) return;
    const button = event.target.closest('button[data-edit],button[data-delete]'); if (!button) return;
    const row = records.find(r => r.id === (button.dataset.edit || button.dataset.delete)); if (!row) return;
    if (button.dataset.edit) { edit(row); return; }
    if (button.dataset.confirm !== '1') { button.dataset.confirm = '1'; button.textContent = 'Confirmar'; setTimeout(() => { button.dataset.confirm = ''; button.textContent = 'Apagar'; },4000); return; }
    const db = source(); if (!db) { message('Banco de inspeção indisponível.', true); return; }
    deleting = true;
    button.disabled = true;
    try {
      const {error} = await db.from('inspecao_defeitos').delete().eq('id',row.id);
      if (error) throw error;
      await load(); renderList(); renderAnalysis();
    } catch (error) {
      button.disabled = false;
      message(`Erro ao apagar: ${error.message || error}`,true);
    } finally { deleting = false; }
  });
  reset();
})();
