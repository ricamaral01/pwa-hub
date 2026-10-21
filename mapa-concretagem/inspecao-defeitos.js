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
  if (!location.pathname.startsWith('/unificado/mapa/operacao') && !window.__insDefTest) {
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
  const icon = d => (typeof DEFEITO_ICONES !== 'undefined' && DEFEITO_ICONES[d[4]]) || '⚠️';
  const source = () => typeof supabaseClient !== 'undefined' ? supabaseClient : null;
  const message = (value, error = false) => { $('insDefMessage').textContent = value; $('insDefMessage').classList.toggle('error', error); $('insDefGlobalStatus').textContent = error ? value : ''; };
  const defects = () => DEF.flatMap(d => REG.map(r => ({codigo:d[0], regiao:r, quantidade:counts[key(d[0],r)] || 0}))).filter(d => d.quantidade);
  const suggested = () => defects().some(d => byCode[d.codigo][2] === 'C') ? 'C' : defects().length ? 'B' : 'A';
  function renderMatrix() {
    const groups = [...new Set(DEF.map(d => d[3]))];
    $('insDefMatrix').innerHTML = groups.map(group => `<section class="ins-def-group"><div class="ins-def-group-title">${escape(group)}</div>
      <div class="ins-def-row ins-def-row-head"><span>Defeito</span>${REG.map(r => `<span>${r}</span>`).join('')}</div>
      ${DEF.filter(d => d[3] === group).map(d => `<div class="ins-def-row"><div class="ins-def-name"><span class="ins-def-icon" aria-hidden="true">${icon(d)}</span><span><span class="ins-def-code">${d[0]} · ${d[2]}</span><br>${escape(d[1])}</span></div>
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
    $('insDefPareto').innerHTML = table(['Código','Defeito','Ocorrências','% acumulado'], pareto.map(([code,q]) => { cumulative += q; return [code,escape(byCode[code]?.[1] || code),nfmt(q),pct(cumulative,total)]; }));
    const heatMax = Math.max(1,...pareto.map(([code]) => Math.max(...REG.map(reg => allDef.filter(d => d.codigo === code && d.regiao === reg).reduce((s,d) => s+d.quantidade,0)))));
    $('insDefHeat').innerHTML = table(['Defeito','Base','Meio','Topo'], pareto.map(([code]) => [code,...REG.map(reg => { const value=allDef.filter(d => d.codigo === code && d.regiao === reg).reduce((s,d) => s+d.quantidade,0); return `<span class="ins-def-heat" style="background:rgba(232,118,42,${(value/heatMax*.5).toFixed(2)})">${nfmt(value)}</span>`; })]));
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
    $('insDefLista').innerHTML = rows.length ? rows.map(r => `<article class="ins-def-list-item"><div class="ins-def-badge ${r.classe}">${escape(r.classe)}</div><div><strong>${escape(r.serie)}</strong><p>${escape(r.setor)} · ${escape(r.data_desforma)} · turno ${escape(r.turno)} · ${escape(r.tipo)} · forma ${escape(r.forma_numero)}</p><p>${(r.defeitos || []).map(d => `${escape(d.codigo)} ${escape(d.regiao)} ×${d.quantidade}`).join(' · ') || 'Sem defeito'}</p></div><div class="ins-def-list-actions"><button type="button" class="btn" data-edit="${escape(r.id)}">Editar</button><button type="button" class="btn" data-delete="${escape(r.id)}">Apagar</button></div></article>`).join('') : '<p>Nenhum poste encontrado.</p>';
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
