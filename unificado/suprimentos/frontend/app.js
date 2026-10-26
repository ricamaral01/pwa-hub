import {supAsk} from './dialog.js';
const ROOT = '/unificado/suprimentos/';
const API = '/api/suprimentos';
const view = location.pathname.split('/').filter(Boolean).pop() || 'painel';
const app = document.getElementById('app');
const state = {me:null, rows:[], counts:{}, countsAt:0, tab:'Todas', selected:new Set(), filters:{}, page:1,
  catalog:[], measures:[], centers:[], draftItems:[], draftPhotos:[], draftStep:1,
  resource:'materiais', resourceRows:[], edit:null};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value || 0));
const date = value => {if(!value)return '—';if(/^\d{4}-\d{2}-\d{2}$/.test(value)){const [year,month,day]=value.split('-');return `${day}/${month}/${year}`;}return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value));};
const dateTime = value => !value ? '—' : new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
function eventLabel(event, total){
  const destination=String(event.para||'');
  if(event.alvo_tipo==='item'&&event.de==='SEPARADO'&&destination==='SEPARADO')return 'Entregue parcialmente';
  if(event.alvo_tipo==='item'&&destination==='SEPARADO')return 'Item separado';
  if(event.alvo_tipo==='item'&&destination==='ENTREGUE')return 'Item entregue';
  if(event.de==='ENTREGUE'&&destination==='EM_ATENDIMENTO')return 'Recebido com problema';
  if(event.de==='EM_ATENDIMENTO'&&destination==='ENTREGUE'&&event.comentario)return 'Problema resolvido · entregue';
  if(destination==='EM_APROVACAO' && event.de==='EM_APROVACAO')return 'Aprovação em andamento';
  if(destination==='EM_APROVACAO')return 'Enviada para aprovação';
  const level=destination.match(/^EM_APROVACAO:(\d+)$/);
  if(level)return `Aprovada — nível ${Number(level[1])-1} de ${Number(total)||Number(level[1])}`;
  if(destination==='CONCLUIDA' && (event.por==='auto'||event.comentario==='Fechamento automático'))return 'Concluída automaticamente';
  if(destination===event.de && event.comentario==='Solicitação editada')return 'Dados da solicitação atualizados';
  return {RASCUNHO:'Rascunho',APROVADA:'Aprovada',EM_ATENDIMENTO:'Em atendimento',ENTREGUE:'Entregue',CONCLUIDA:'Concluída',DEVOLVIDA:'Devolvida',REPROVADA:'Reprovada',CANCELADA:'Cancelada'}[destination]||destination.replaceAll('_',' ').toLocaleLowerCase('pt-BR');
}
const age = value => { const hours = Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/3600000)); return hours < 24 ? `${hours} h` : `${Math.floor(hours/24)} d`; };
const path = (page,id='') => ROOT + page + '/' + (id ? `?id=${encodeURIComponent(id)}` : '');
const badge = (value, type='status') => {
  const labels={EM_APROVACAO:'Em aprovação',EM_ATENDIMENTO:'Em atendimento',APROVADA:'Aprovada',ENTREGUE:'Entregue',CONCLUIDA:'Concluída',DEVOLVIDA:'Devolvida',REPROVADA:'Reprovada',CANCELADA:'Cancelada',RASCUNHO:'Rascunho',PAROU_PRODUCAO:'Parou produção',URGENTE:'Urgente',NORMAL:'Normal',PENDENTE:'Pendente',SEPARADO:'Separado'};
  const tone=type==='urgencia' ? value==='PAROU_PRODUCAO'?'stopped':value==='URGENTE'?'urgent':'ok' : ['APROVADA','ENTREGUE','CONCLUIDA'].includes(value)?'ok':value==='EM_APROVACAO'?'wait':value==='DEVOLVIDA'?'return':value==='REPROVADA'?'stopped':'';
  return `<span class="badge ${tone}">${esc(labels[value]||value)}</span>`;
};
const loading = () => {app.innerHTML='<div class="loading-state"><span class="spinner" aria-hidden="true"></span>Carregando Suprimentos…</div>';};
const empty = (title,detail='') => `<div class="empty-state"><strong>${esc(title)}</strong><span>${esc(detail)}</span></div>`;
const showError = error => {app.innerHTML=`<div class="error-state"><strong>Não foi possível carregar esta tela.</strong><span>${esc(error.message||error)}</span><button class="btn" id="retry">Tentar novamente</button></div>`;document.getElementById('retry').onclick=init;};
const toast = message => {document.querySelector('.toast')?.remove();const node=document.createElement('div');node.className='toast';node.textContent=message;document.body.append(node);setTimeout(()=>node.remove(),4200);};
const humanError = error => {toast(error.message||'Não foi possível concluir a ação.');};

async function api(url, options={}, retry=true){
  const headers={...options.headers};
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
  const response=await fetch(API+url,{credentials:'same-origin',cache:'no-store',...options,headers});
  if(response.status===401 && retry){
    const renewed=await fetch(ROOT+'session-renew',{credentials:'same-origin',cache:'no-store'}).catch(()=>null);
    if(renewed?.ok) return api(url,options,false);
    throw new Error('Sessão expirada. Entre novamente; seus dados não enviados permanecem no dispositivo.');
  }
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(result.detail||result.error||`Falha ${response.status}`);
  return result;
}
const data = (url,body,method='POST') => api(url,{method,body:JSON.stringify(body)});
function header(title,subtitle,actions=''){
  return `<header class="page-head"><div><p class="eyebrow">CAMPINAS · SUPRIMENTOS</p><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="head-actions">${actions}</div></header>`;
}
function hasRole(role){return state.me?.papeis?.some(item=>item.papel===role);}
function canApprove(row){return row.status==='EM_APROVACAO' && state.me?.papeis?.some(item=>item.papel==='APROVADOR' && Number(item.nivel)===Number(row.nivel_atual) && (!item.cc_id||item.cc_id===row.cc_id));}
function canAdmin(){return hasRole('ADMIN');}
function allowedCenters(){if(canAdmin())return state.centers.filter(x=>x.ativo);const grants=state.me?.papeis?.filter(x=>x.papel==='SOLICITANTE')||[];return state.centers.filter(x=>x.ativo&&grants.some(role=>!role.cc_id||role.cc_id===x.id));}
function actionButton(label,id,variant=''){return `<button class="btn ${variant}" type="button" data-action="${esc(id)}">${esc(label)}</button>`;}

async function loadPanel(){
  const [list,home]=await Promise.all([api('/solicitacoes?size=100'),api('/pwa/inicio')]);
  state.rows=list.items;
  const mine=home.aprovar||[];
  const late=mine.filter(row=>new Date(row.criado_em).getTime()<Date.now()-86400000).length;
  const active=state.rows.filter(row=>row.status==='EM_ATENDIMENTO');
  const urgent=active.filter(row=>row.urgencia!=='NORMAL').length;
  app.innerHTML=header('Painel de suprimentos','Sua fila de trabalho e as solicitações da unidade.',
    `<a class="btn primary" href="${path('nova')}"><span class="icon-plus">+</span> Nova solicitação</a>`) +
    `<div class="kpi-grid"><section class="card kpi"><span class="label">Aguardando sua aprovação</span><span class="value">${mine.length}</span><small>${late} há mais de 24 h</small></section>
    <section class="card kpi alert"><span class="label">Em atendimento</span><span class="value">${active.length}</span><small>${urgent} urgentes / parou produção</small></section></div>
    <section class="card"><div class="section-head"><h2>Fila de trabalho</h2><a href="${path('solicitacoes')}">Ver todas →</a></div>${tableRows(state.rows.slice(0,20),true)}</section>`;
  if(state.me?.flags?.S3A&&(hasRole('COMPRADOR')||hasRole('QUALIDADE')||canAdmin())){
    try{const s=await api('/compras/resumo');app.insertAdjacentHTML('beforeend',`<div class="kpi-grid sup-purchase-kpis">
      <section class="card kpi"><span class="label">Pedidos abertos</span><span class="value">${s.pedidos_abertos}</span><small>${s.pedidos_atrasados} atrasados</small></section>
      <section class="card kpi"><span class="label">Fornecedores</span><span class="value">${s.homologacoes_pendentes}</span><small>em qualificação · ${s.documentos_vencendo} documentos vencendo</small></section></div>`)}catch(error){console.warn('Indicadores de compras indisponíveis',error.message)}
  }
  if(state.me?.flags?.S2&&(hasRole('ALMOXARIFE')||hasRole('COMPRADOR')||canAdmin())){
    try{const stock=await api('/estoque/saldos?abaixo_pp=true');app.insertAdjacentHTML('beforeend',`<section class="card"><div class="section-head"><h2>Almoxarifado · abaixo do ponto de pedido</h2><a href="${path('almoxarifado')}">Ver saldos →</a></div><p>${stock.items.length} material(is) precisam de atenção.</p></section>`)}catch(error){console.warn('Indicadores de estoque indisponíveis',error.message)}
  }
  if(state.me?.flags?.S4&&(hasRole('COMPRADOR')||canAdmin())){
    try{
      const silos=await api('/integracao/sugestoes?size=5');
      app.insertAdjacentHTML('beforeend',`<section class="card"><div class="section-head sup-silo-head"><h2>Silos da usina · Ressuprimento sugerido</h2><span class="badge wait">${silos.total} pendente(s)</span></div><p>Solicitações recebidas do Laboratório para conferência de Compras.</p>${silos.items.length?`<div class="table-scroll"><table><thead><tr><th>Material</th><th>Silo</th><th>Quantidade</th><th>Data limite</th></tr></thead><tbody>${silos.items.map(x=>`<tr><td>${esc(x.material_descricao||x.material_id)}</td><td>${esc(x.destino_ref)}</td><td>${esc(x.qtd)}</td><td>${date(x.data_limite)}</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma sugestão dos silos') }</section>`);
    }catch(error){console.warn('Sugestões dos silos indisponíveis',error.message)}
  }
}
function tableRows(rows,panel=false){
  if(!rows.length)return empty('Nenhuma solicitação nesta fila','As novas solicitações aparecerão aqui.');
  return `<div class="table-scroll"><table><thead><tr><th>Nº</th><th>Solicitante / setor</th><th>Itens</th><th>Urgência</th><th>Situação</th><th>Idade</th></tr></thead><tbody>${rows.map(row=>`<tr><td><a class="link-row" href="${path('solicitacao',row.id)}">${esc(row.numero)}</a></td><td>${esc(row.solicitante_nome)}<small class="cell-muted">${esc(centerName(row.cc_id))}</small></td><td>${esc(row.resumo||'Ver itens')}</td><td>${badge(row.urgencia,'urgencia')}</td><td>${badge(row.status)}${row.nivel_atual?`<small class="cell-muted">Nível ${row.nivel_atual} de ${row.niveis_total}</small>`:''}</td><td class="nowrap">${age(row.criado_em)}</td></tr>`).join('')}</tbody></table></div>`;
}
function centerName(id){return state.centers.find(x=>x.id===id)?.nome||'Centro de custo';}

const TABS=[['Todas',[]],['Em aprovação',['EM_APROVACAO']],['Devolvidas',['DEVOLVIDA']],['Aprovadas / separar',['APROVADA','EM_ATENDIMENTO']],['Entregues',['ENTREGUE']],['Concluídas',['CONCLUIDA']],['Canceladas / reprovadas',['CANCELADA','REPROVADA']]];
async function loadRequestList(){
  const base=new URLSearchParams({size:'100',page:String(state.page)});
  for(const [key,value] of Object.entries(state.filters))if(value)base.set(key,value);
  const tab=TABS.find(x=>x[0]===state.tab)||TABS[0];
  const statuses=tab[1].length?tab[1]:[null];
  const unique=[...new Set(TABS.flatMap(x=>x[1]))];
  const refreshCounts=Date.now()-state.countsAt>30000;
  const [results,totals]=await Promise.all([
    Promise.all(statuses.map(status=>{const query=new URLSearchParams(base);if(status)query.set('status',status);return api('/solicitacoes?'+query);})),
    refreshCounts?Promise.all(unique.map(status=>api('/solicitacoes?status='+status+'&size=1'))):Promise.resolve(null)
  ]);
  state.rows=results.flatMap(x=>x.items).sort((a,b)=>new Date(b.criado_em)-new Date(a.criado_em));
  state.total=results.reduce((sum,x)=>sum+x.total,0);
  if(totals){state.counts=Object.fromEntries(unique.map((status,index)=>[status,totals[index].total]));state.countsAt=Date.now();}
  renderRequestList();
}
function renderRequestList(){
  const tabs=TABS.map(([label,statuses])=>`<button type="button" class="tab ${state.tab===label?'active':''}" data-tab="${esc(label)}">${esc(label)}${statuses.length?` (${statuses.reduce((sum,x)=>sum+(state.counts[x]||0),0)})`:''}</button>`).join('');
  const rows=state.rows;
  app.innerHTML=header('Solicitações','Acompanhe pedidos, alçadas e atendimento.',`<a class="btn primary" href="${path('nova')}"><span class="icon-plus">+</span> Nova solicitação</a>`) +
    `<section class="card"><div class="tabs" role="tablist" aria-label="Situação">${tabs}</div>
    <div class="filters"><div class="field search"><label for="search">Buscar</label><input id="search" placeholder="Nº ou solicitante" value="${esc(state.filters.q||'')}"></div>
    <div class="field"><label for="cc">Setor / CC</label><select id="cc"><option value="">Todos</option>${state.centers.map(x=>`<option value="${x.id}" ${state.filters.cc_id===x.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div>
    <div class="field"><label for="urgency">Urgência</label><select id="urgency"><option value="">Todas</option>${['NORMAL','URGENTE','PAROU_PRODUCAO'].map(x=>`<option value="${x}" ${state.filters.urgencia===x?'selected':''}>${esc(x.replaceAll('_',' '))}</option>`).join('')}</select></div>
    <div class="field"><label for="origin">Origem</label><select id="origin"><option value="">Todas</option><option value="web" ${state.filters.origem==='web'?'selected':''}>Web</option><option value="pwa" ${state.filters.origem==='pwa'?'selected':''}>PWA</option></select></div>
    <label><input type="checkbox" id="mine" ${state.filters.minha_alcada?'checked':''}> Só as que eu aprovo</label><button class="btn" id="filter">Aplicar filtros</button></div>
    ${rows.length?`<div class="table-scroll"><table class="requests-table"><thead><tr><th><span class="sr-only">Selecionar</span></th><th>Nº / aberta em</th><th>Solicitante / setor</th><th>Itens</th><th>Valor estimado</th><th>Urgência</th><th>Precisa em</th><th>Alçada</th><th>Origem</th></tr></thead><tbody>${rows.map(row=>`<tr><td><input type="checkbox" class="select-row" value="${row.id}" ${canApprove(row)?'':'disabled'} ${state.selected.has(row.id)?'checked':''} aria-label="Selecionar ${esc(row.numero)}"></td><td><a class="link-row" href="${path('solicitacao',row.id)}">${esc(row.numero)}</a><small class="cell-muted">${date(row.criado_em)}</small></td><td>${esc(row.solicitante_nome)}<small class="cell-muted">${esc(centerName(row.cc_id))}</small></td><td>${esc(row.resumo||'Ver detalhe')}</td><td class="nowrap">${money(row.valor_estimado)}${row.sem_preco?'<small class="cell-muted">Sem preço</small>':''}</td><td>${badge(row.urgencia,'urgencia')}</td><td>${date(row.precisa_em)}</td><td>${row.nivel_atual?`Nível ${row.nivel_atual} de ${row.niveis_total}`:badge(row.status)}</td><td>${row.origem==='pwa'?'PWA':'Web'}</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhuma solicitação encontrada','Ajuste os filtros ou crie uma nova solicitação.')}
    <div class="toolbar" style="margin-top:14px"><span class="muted">${state.total} solicitação(ões) · página ${state.page}</span><div class="actions"><button class="btn small" id="prev" ${state.page<=1?'disabled':''}>Anterior</button><button class="btn small" id="next" ${state.page*100>=state.total?'disabled':''}>Próxima</button></div></div>
    <p class="note">Valor estimado = quantidade × último custo conhecido. Sem custo, usa o preço informado pelo comprador/almoxarife ou R$ 0,00 com aviso “sem preço”.</p></section>
    <div class="batch-bar" id="batch" ${state.selected.size?'':'hidden'}><div><strong id="batch-count"></strong><small id="batch-value"></small></div><div class="actions"><button class="btn" id="batch-return">Devolver</button><button class="btn primary" id="batch-approve">Aprovar selecionadas</button></div></div>`;
  app.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{state.tab=button.dataset.tab;state.page=1;state.selected.clear();loadRequestList().catch(showError);});
  document.getElementById('filter').onclick=()=>{state.filters={q:document.getElementById('search').value.trim(),cc_id:document.getElementById('cc').value,urgencia:document.getElementById('urgency').value,origem:document.getElementById('origin').value,minha_alcada:document.getElementById('mine').checked?'true':''};state.page=1;state.selected.clear();loadRequestList().catch(showError);};
  document.getElementById('prev').onclick=()=>{state.page--;loadRequestList().catch(showError);};
  document.getElementById('next').onclick=()=>{state.page++;loadRequestList().catch(showError);};
  app.querySelectorAll('.select-row').forEach(check=>check.onchange=()=>{if(check.checked)state.selected.add(check.value);else state.selected.delete(check.value);updateBatch();});
  document.getElementById('batch-approve').onclick=()=>batchDecision('APROVADA');
  document.getElementById('batch-return').onclick=()=>batchDecision('DEVOLVIDA');
  updateBatch();
}
function updateBatch(){const bar=document.getElementById('batch');if(!bar)return;bar.hidden=!state.selected.size;const selected=state.rows.filter(x=>state.selected.has(x.id));document.getElementById('batch-count').textContent=`${selected.length} selecionada(s) · ${selected.every(canApprove)?'dentro da sua alçada':'há itens fora da sua alçada'}`;document.getElementById('batch-value').textContent=money(selected.reduce((sum,x)=>sum+Number(x.valor_estimado),0));}
async function batchDecision(decisao){const ids=[...state.selected];if(!ids.length)return;let comentario='';if(decisao==='DEVOLVIDA'){comentario=await supAsk('Devolver solicitações',{label:'Motivo da devolução',multiline:true});if(!comentario)return;}try{const result=await data('/solicitacoes/aprovar-lote',{ids,decisao,comentario});const ok=result.resultados.filter(x=>x.ok).length;toast(`${ok} de ${ids.length} solicitações processadas.`);state.selected.clear();state.countsAt=0;await loadRequestList();}catch(error){humanError(error);}}

async function loadDetail(){
  const id=new URLSearchParams(location.search).get('id');if(!id)throw new Error('Informe uma solicitação.');
  const row=await api('/solicitacoes/'+encodeURIComponent(id));
  state.detail=row;renderDetail();
}
function renderDetail(){
  const row=state.detail, owner=row.solicitante_id===state.me.id, approver=canApprove(row), alm=hasRole('ALMOXARIFE')||canAdmin();
  const actions=[];
  if(approver)actions.push(actionButton('Reprovar','reprovar','danger'),actionButton('Devolver para ajuste','devolver'),actionButton('Aprovar','aprovar','primary'));
  if(owner&&row.status==='ENTREGUE')actions.push(actionButton('Recebi com problema','problema'),actionButton('Recebi tudo','confirmar','primary'));
  if(owner&&['RASCUNHO','DEVOLVIDA'].includes(row.status))actions.push(actionButton('Enviar para aprovação','enviar','primary'));
  if(owner&&['RASCUNHO','DEVOLVIDA','EM_APROVACAO','APROVADA'].includes(row.status))actions.push(actionButton('Cancelar','cancelar','danger'));
  if(alm&&row.status==='EM_ATENDIMENTO'&&row.eventos.some(x=>x.de==='ENTREGUE'&&x.para==='EM_ATENDIMENTO'))actions.push(actionButton('Registrar solução','reentregar','primary'));
  app.innerHTML=`<a href="${path('solicitacoes')}" class="btn quiet">← Solicitações</a>`+
    header(`Solicitação ${row.numero}`,'Detalhes, atendimento e histórico.',actions.join(''))+
    `<div class="split"><div class="stack"><section class="card"><div class="section-head"><h2>Dados da solicitação</h2><div class="actions">${badge(row.status)} ${badge(row.urgencia,'urgencia')}</div></div><dl class="detail-grid">
    <div><dt>Solicitante</dt><dd>${esc(row.solicitante_nome)}</dd></div><div><dt>Setor / CC</dt><dd>${esc(centerName(row.cc_id))}</dd></div><div><dt>Aberta em · origem</dt><dd>${date(row.criado_em)} · ${row.origem==='pwa'?'PWA':'Web'}</dd></div><div><dt>Precisa em</dt><dd>${date(row.precisa_em)}</dd></div><div><dt>Valor estimado</dt><dd>${money(row.valor_estimado)} ${row.sem_preco?'<span class="badge urgent">Sem preço</span>':''}</dd></div><div><dt>Alçada aplicada</dt><dd>${row.niveis_total?`Nível ${row.nivel_atual||row.niveis_total} de ${row.niveis_total}`:'A definir no envio'}</dd></div><div class="full"><dt>Justificativa</dt><dd>${esc(row.justificativa||'Não informada')}</dd></div></dl></section>
    <section class="card"><h2>Itens solicitados</h2><div class="table-scroll"><table><thead><tr><th>Item / código</th><th>Qtd</th><th>Situação</th><th>Entregue</th>${alm?'<th>Atendimento</th>':''}</tr></thead><tbody>${row.itens.map(item=>`<tr><td><strong>${esc(item.descricao_livre||item.material_id||'Material')}</strong><small class="cell-muted">${item.material_id?esc(item.material_id):'Fora do catálogo'}</small></td><td>${Number(item.qtd).toLocaleString('pt-BR')}</td><td>${badge(item.status)}</td><td>${Number(item.qtd_entregue).toLocaleString('pt-BR')}</td>${alm?`<td><div class="item-row-actions">${item.status==='PENDENTE'&&['APROVADA','EM_ATENDIMENTO'].includes(row.status)?`<button class="btn small" data-item-action="separar" data-item-id="${item.id}">Separar</button><button class="btn small danger" data-item-action="cancelar" data-item-id="${item.id}">Cancelar</button>`:''}${item.status==='SEPARADO'&&row.status==='EM_ATENDIMENTO'?`<button class="btn small primary" data-item-action="entregar" data-item-id="${item.id}">Entregar qtd</button>`:''}</div></td>`:''}</tr>`).join('')}</tbody></table></div></section>
    ${row.fotos.length?`<section class="card"><h2>Fotos</h2><div class="photo-list">${row.fotos.map(photo=>`<a href="${API}/solicitacoes/${row.id}/fotos/${photo.id}" target="_blank" rel="noopener">📷 ${esc(photo.nome_original)}</a>`).join('')}</div></section>`:'<p class="photo-empty">Sem fotos anexadas</p>'}</div>
    <aside class="card"><h2>Histórico</h2><ol class="timeline">${row.eventos.map(event=>`<li><strong>${esc(eventLabel(event,row.niveis_total))}</strong><span class="cell-muted">${esc(event.por_nome||'Sistema')}</span>${event.comentario?`<p>${esc(event.comentario)}</p>`:''}<time>${dateTime(event.em)}</time></li>`).join('')}</ol>${approver?'<div class="comment-box"><div class="field"><label for="comment">Comentário para devolver ou reprovar</label><textarea id="comment" placeholder="Explique o ajuste necessário"></textarea></div></div>':''}</aside></div>`;
  app.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>detailAction(button.dataset.action));
  if(alm&&state.me?.flags?.S3A){
    for(const item of row.itens.filter(x=>x.status==='PENDENTE'&&['APROVADA','EM_ATENDIMENTO'].includes(row.status))){
      const group=app.querySelector(`[data-item-id="${item.id}"]`)?.closest('.item-row-actions');
      if(group){const button=document.createElement('button');button.className='btn small soft';button.type='button';button.textContent=item.destino==='COMPRA'?'Destino: compra':'Enviar à compra';button.disabled=item.destino==='COMPRA';button.onclick=()=>itemAction(item.id,'comprar');group.append(button)}
    }
  }
  app.querySelectorAll('[data-item-action]').forEach(button=>button.onclick=()=>itemAction(button.dataset.itemId,button.dataset.itemAction));
}
async function detailAction(action){
  const row=state.detail;let body={};
  if(['devolver','reprovar'].includes(action)){body.comentario=document.getElementById('comment')?.value.trim();if(!body.comentario){toast('Escreva um comentário antes de continuar.');return;}}
  if(action==='problema'){body.comentario=await supAsk('Problema no recebimento',{label:'Descreva o problema',multiline:true});if(!body.comentario)return;action='recebi-com-problema';}
  if(action==='reentregar'){body.comentario=await supAsk('Registrar solução',{label:'Solução aplicada',multiline:true});if(!body.comentario)return;}
  if(action==='confirmar')action='confirmar-recebimento';
  try{await data(`/solicitacoes/${row.id}/${action}`,body);toast('Solicitação atualizada.');await loadDetail();}catch(error){humanError(error);}
}
async function itemAction(id,action){let body={};if(action==='entregar'){const quantity=await supAsk('Entregar item',{label:'Quantidade entregue',type:'number'});if(!quantity)return;body.qtd=quantity;}if(action==='cancelar'){body.comentario=await supAsk('Cancelar item',{label:'Motivo do cancelamento',multiline:true});if(!body.comentario)return;}try{if(action==='comprar')await data(`/compras/itens/${id}/destino`,{destino:'COMPRA'});else await data(`/itens/${id}/${action}`,body);toast('Item atualizado.');await loadDetail();}catch(error){humanError(error);}}

async function loadNew(){
  const [catalog,measures]=await Promise.all([api('/cadastros/materiais?size=100'),api('/cadastros/unidades-medida?size=100')]);
  state.catalog=catalog.items.filter(item=>item.dominio==='almoxarifado'||(state.me?.flags?.S4&&item.dominio==='insumo_usina'));state.measures=measures.items;
  state.draftItems=[];state.draftPhotos=[];state.draftStep=1;renderNew();
}
function renderNew(){
  app.innerHTML=`<a class="btn quiet" href="${path('solicitacoes')}">← Solicitações</a>`+header('Nova solicitação','Escolha os itens e informe quando precisa deles.')+
    `<div class="stepper"><span class="step ${state.draftStep===1?'active':''}"><b>1</b> Itens</span><span class="step-line"></span><span class="step ${state.draftStep===2?'active':''}"><b>2</b> Detalhes e envio</span></div>
    <section class="card">${state.draftStep===1?newItemsHtml():newDetailsHtml()}</section>`;
  if(state.draftStep===1)bindNewItems();else bindNewDetails();
}
function newItemsHtml(){return `<h2>O que você precisa?</h2><div class="item-builder"><div class="field"><label for="material-search">Material por nome ou código</label><input id="material-search" list="material-options" placeholder="Digite para buscar"><datalist id="material-options">${state.catalog.map(x=>`<option value="${esc(x.codigo)}">${esc(x.descricao)}</option>`).join('')}</datalist></div><div class="field"><label for="quantity">Quantidade</label><input id="quantity" type="number" min="0.0001" step="0.0001" value="1"></div><div class="field"><label for="measure">Unidade</label><select id="measure">${state.measures.map(x=>`<option value="${x.id}">${esc(x.sigla)}</option>`).join('')}</select></div><button class="btn soft" id="add-item">Adicionar</button></div>
  <button class="btn quiet" id="free-item">+ Item que não acho na lista — descrever e fotografar</button>
  <div class="request-items">${state.draftItems.length?state.draftItems.map((item,index)=>`<div class="request-item"><div><strong>${esc(item.label)}</strong><small>${item.qtd} ${esc(state.measures.find(x=>x.id===item.un)?.sigla||'')}</small></div><button class="btn small danger" data-remove="${index}">Remover</button></div>`).join(''):empty('Nenhum item adicionado','Busque um material ou descreva um item fora do catálogo.')}</div><div class="actions"><button class="btn primary" id="continue" ${state.draftItems.length?'':'disabled'}>Continuar · ${state.draftItems.length} itens</button></div>`;}
function bindNewItems(){
  document.getElementById('material-search').onchange=()=>{const found=state.catalog.find(x=>x.codigo===document.getElementById('material-search').value);if(found)document.getElementById('measure').value=found.un_estoque;};
  document.getElementById('add-item').onclick=()=>{const value=document.getElementById('material-search').value.trim();const found=state.catalog.find(x=>x.codigo===value||x.descricao.toLowerCase()===value.toLowerCase());const qty=Number(document.getElementById('quantity').value);if(!found||!(qty>0)){toast('Escolha um material e quantidade válida.');return;}state.draftItems.push({material_id:found.id,qtd:qty,un:document.getElementById('measure').value,label:`${found.codigo} · ${found.descricao}`});renderNew();};
  document.getElementById('free-item').onclick=async()=>{const qty=Number(document.getElementById('quantity').value)||1,un=document.getElementById('measure').value;const description=await supAsk('Item fora do catálogo',{label:'Descrição do material',multiline:true});if(!description)return;state.draftItems.push({descricao_livre:description,qtd:qty,un,label:description});renderNew();toast('Anexe uma foto na próxima etapa, se possível.');};
  app.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{state.draftItems.splice(Number(button.dataset.remove),1);renderNew();});
  document.getElementById('continue').onclick=()=>{state.draftStep=2;renderNew();};
}
function newDetailsHtml(){const centers=allowedCenters();return `<h2>Detalhes da necessidade</h2><form id="request-form" class="form-grid"><div class="field"><label for="request-cc">Setor / centro de custo</label><select id="request-cc" required><option value="">Selecione</option>${centers.map(x=>`<option value="${x.id}" ${centers.length===1?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div>
  <div class="field"><label for="needed">Preciso para</label><input id="needed" type="date"></div><div class="field full"><label for="urgency">Urgência</label><select id="urgency"><option value="NORMAL">Normal · programação regular</option><option value="URGENTE">Urgente · prioridade de atendimento</option><option value="PAROU_PRODUCAO">Parou produção · linha interrompida</option></select></div>
  <div class="field full"><label for="reason">Por que precisa?</label><textarea id="reason" placeholder="Informe o motivo e a aplicação"></textarea></div><div class="field full"><label for="photos">Fotos (até 3, 2 MB cada)</label><input id="photos" type="file" accept="image/jpeg,image/png" multiple><small>${state.draftPhotos.length} selecionada(s)</small></div>
  <div class="actions full"><button class="btn" type="button" id="back-items">Voltar aos itens</button><button class="btn primary" type="submit">Enviar solicitação</button></div></form>`;}
function bindNewDetails(){document.getElementById('back-items').onclick=()=>{state.draftStep=1;renderNew();};document.getElementById('photos').onchange=event=>{state.draftPhotos=[...event.target.files].slice(0,3);if(event.target.files.length>3)toast('Selecione até 3 fotos.');};document.getElementById('request-form').onsubmit=async event=>{event.preventDefault();const cc=document.getElementById('request-cc').value,urgencia=document.getElementById('urgency').value,justificativa=document.getElementById('reason').value.trim();if(!cc){toast('Selecione o centro de custo.');return;}if(urgencia==='PAROU_PRODUCAO'&&justificativa.length<20){toast('Explique a parada da produção com pelo menos 20 caracteres.');return;}const button=event.submitter;button.disabled=true;button.textContent='Enviando…';try{const row=await data('/solicitacoes',{cc_id:cc,urgencia,justificativa,precisa_em:document.getElementById('needed').value||null,itens:state.draftItems.map(({label,...item})=>item)});for(const photo of state.draftPhotos){const form=new FormData();form.append('arquivo',photo);await api(`/solicitacoes/${row.id}/fotos`,{method:'POST',body:form});}await data(`/solicitacoes/${row.id}/enviar`,{});location.assign(path('solicitacao',row.id));}catch(error){button.disabled=false;button.textContent='Enviar solicitação';humanError(error);}};}

const RESOURCES={
  materiais:{title:'Materiais',fields:['codigo','descricao','categoria','un_estoque','dominio','controla_estoque','exige_ca','patrimoniado'],required:['codigo','descricao','categoria','un_estoque','dominio']},
  'unidades-medida':{title:'Unidades de medida',fields:['sigla','descricao'],required:['sigla','descricao']},
  locais:{title:'Locais',fields:['tipo','nome'],required:['tipo','nome']},
  enderecos:{title:'Endereços',fields:['local_id','codigo'],required:['local_id','codigo']},
  'centros-custo':{title:'Centros de custo',fields:['codigo','nome','setor'],required:['codigo','nome']},
  alcadas:{title:'Alçadas',fields:['cc_id','categoria','valor_ate','nivel','papel_aprovador','a_confirmar'],required:['nivel','papel_aprovador']},
  parametros:{title:'Parâmetros',fields:['chave','valor','a_confirmar'],required:['chave','valor']},
  'usuarios-papeis':{title:'Usuários e papéis',fields:['iam_user_id','papel','cc_id','nivel'],required:['iam_user_id','papel']},
  flags:{title:'Flags',fields:['fase','habilitado'],required:['fase','habilitado']},
  fornecedores:{title:'Fornecedores',fields:['cnpj','razao','categorias','situacao'],required:['cnpj','razao']},
};
async function loadResources(){const resource=view==='fornecedores'?'fornecedores':state.resource;const result=await api(`/cadastros/${resource}?size=100&q=${encodeURIComponent(state.filters.q||'')}`);state.resourceRows=result.items;state.resourceTotal=result.total;renderResources();}
function renderResources(){const resource=view==='fornecedores'?'fornecedores':state.resource;const spec=RESOURCES[resource];const isSupAdmin=canAdmin();const tabs=view==='fornecedores'?'':`<div class="tabs compact" role="tablist">${Object.entries(RESOURCES).filter(([key])=>key!=='fornecedores'&&(key!=='flags'||isSupAdmin)).map(([key,value])=>`<button class="tab ${resource===key?'active':''}" data-resource="${key}">${esc(value.title)}</button>`).join('')}</div>`;
  app.innerHTML=header(spec.title,view==='fornecedores'?'Cadastro e qualificação de fornecedores.':'Catálogos, parâmetros e alçadas de Campinas.',`<button class="btn primary" id="create"><span class="icon-plus">+</span> Novo cadastro</button>`) +
    `<section class="card">${tabs}<div class="toolbar"><div class="field search"><label for="resource-search">Buscar</label><input id="resource-search" value="${esc(state.filters.q||'')}" placeholder="Nome, código ou identificação"></div><div class="actions"><button class="btn" id="resource-filter">Buscar</button>${['materiais','fornecedores'].includes(resource)?'<label class="btn">Importar CSV<input class="sr-only" id="csv-upload" type="file" accept=".csv,text/csv"></label>':''}</div></div>
    ${state.resourceRows.length?`<div class="table-scroll"><table><thead><tr>${spec.fields.slice(0,5).map(field=>`<th>${esc(field.replaceAll('_',' '))}</th>`).join('')}<th>Situação</th><th>Ação</th></tr></thead><tbody>${state.resourceRows.map(row=>`<tr>${spec.fields.slice(0,5).map(field=>`<td>${esc(formatField(row[field]))}</td>`).join('')}<td>${row.ativo===false?badge('Inativo'):badge('Ativo')}</td><td><button class="btn small" data-edit="${esc(row.id||row.material_id)}">Editar</button></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhum registro encontrado','Use Novo cadastro para começar.')}
    <p class="note">${state.resourceTotal} registro(s). Cadastros são desativados sem exclusão física. Parâmetros e alçadas com “a confirmar” precisam de revisão administrativa.</p><div id="csv-report">${state.csvReport||''}</div></section>`;
  app.querySelectorAll('[data-resource]').forEach(button=>button.onclick=()=>{state.resource=button.dataset.resource;state.filters.q='';loadResources().catch(showError);});
  document.getElementById('resource-filter').onclick=()=>{state.filters.q=document.getElementById('resource-search').value.trim();loadResources().catch(showError);};
  document.getElementById('create').onclick=()=>openDrawer(null);
  app.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>openDrawer(state.resourceRows.find(row=>String(row.id||row.material_id)===button.dataset.edit)));
  const upload=document.getElementById('csv-upload');if(upload)upload.onchange=async()=>{const file=upload.files[0];if(!file)return;const form=new FormData();form.append('arquivo',file);try{const result=await api(`/cadastros/${resource}/importar`,{method:'POST',body:form});state.csvReport=`<div class="notice ${result.ok?'':'warn'}">${result.ok?'Importação concluída':'Nenhuma linha gravada; corrija os erros.'}</div><div class="import-report">${result.linhas.map(x=>`<div>Linha ${x.linha}: ${x.ok?'OK':esc(x.erro)}</div>`).join('')}</div>`;if(result.ok)await loadResources();else document.getElementById('csv-report').innerHTML=state.csvReport;}catch(error){humanError(error);}};
}
function formatField(value){if(Array.isArray(value))return value.join(', ');if(value===null||value===undefined||value==='')return '—';if(typeof value==='boolean')return value?'Sim':'Não';return value;}
function formField(field,value){const label=field.replaceAll('_',' '),v=value??'';if(['controla_estoque','exige_ca','patrimoniado','a_confirmar','habilitado'].includes(field))return `<div class="field"><label for="f-${field}">${esc(label)}</label><select id="f-${field}" name="${field}"><option value="true" ${v===true?'selected':''}>Sim</option><option value="false" ${v===false?'selected':''}>Não</option></select></div>`;
  const options={categoria:['EPI','ABRASIVO','FERRAMENTA','CONSUMIVEL_PRODUCAO','MANUTENCAO','LIMPEZA_ESCRITORIO','INSUMO_USINA','OUTROS'],dominio:['almoxarifado','insumo_usina'],tipo:['almoxarifado','deposito_inflamaveis','patio'],papel:['SOLICITANTE','APROVADOR','ALMOXARIFE','COMPRADOR','QUALIDADE','ADMIN'],situacao:['em_qualificacao','qualificado','bloqueado'],fase:['S0','S1','S2','S3','S4']};
  if(field==='un_estoque')options[field]=state.measures.map(x=>[x.id,x.sigla]);
  if(field==='cc_id')options[field]=[['','Todos os CCs'],...state.centers.map(x=>[x.id,x.nome])];
  if(field==='local_id')options[field]=(state.locals||[]).map(x=>[x.id,x.nome]);
  if(options[field])return `<div class="field"><label for="f-${field}">${esc(label)}</label><select id="f-${field}" name="${field}">${options[field].map(item=>{const [id,name]=Array.isArray(item)?item:[item,item];return `<option value="${esc(id)}" ${String(id)===String(v)?'selected':''}>${esc(name)}</option>`;}).join('')}</select></div>`;
  return `<div class="field"><label for="f-${field}">${esc(label)}</label><input id="f-${field}" name="${field}" value="${esc(Array.isArray(v)?v.join('|'):v)}" ${['valor','valor_ate'].includes(field)?'inputmode="decimal"':''}></div>`;}
async function openDrawer(row){state.edit=row;const resource=view==='fornecedores'?'fornecedores':state.resource;if(resource==='enderecos'&&!state.locals){state.locals=(await api('/cadastros/locais?size=100')).items;}if(resource==='materiais'&&!state.measures.length){state.measures=(await api('/cadastros/unidades-medida?size=100')).items;}
  const backdrop=document.createElement('div');backdrop.className='drawer-backdrop';backdrop.onclick=closeDrawer;const drawer=document.createElement('aside');drawer.className='drawer';drawer.setAttribute('aria-label',row?'Editar cadastro':'Novo cadastro');drawer.innerHTML=`<div class="drawer-head"><div><p class="eyebrow">SUPRIMENTOS</p><h2>${row?'Editar':'Novo'} · ${esc(RESOURCES[resource].title)}</h2></div><button class="btn small" id="close-drawer" aria-label="Fechar">✕</button></div><form id="drawer-form" class="drawer-form">${RESOURCES[resource].fields.map(field=>formField(field,row?.[field])).join('')}<div class="drawer-actions"><button class="btn" type="button" id="cancel-drawer">Cancelar</button><button class="btn primary" type="submit">Salvar</button></div></form>${row&&'ativo'in row?`<button class="btn danger" id="toggle-status">${row.ativo?'Desativar':'Ativar'}</button>`:''}`;document.body.append(backdrop,drawer);document.getElementById('close-drawer').onclick=closeDrawer;document.getElementById('cancel-drawer').onclick=closeDrawer;
  document.getElementById('drawer-form').onsubmit=async event=>{event.preventDefault();const form=new FormData(event.target);const body={};for(const field of RESOURCES[resource].fields){let value=form.get(field);if(['controla_estoque','exige_ca','patrimoniado','a_confirmar','habilitado'].includes(field))value=value==='true';else if(field==='categorias')value=value?String(value).split('|').map(x=>x.trim()).filter(Boolean):[];else if(['valor','valor_ate','nivel'].includes(field))value=value===''?null:Number(String(value).replace(',','.'));else if(value==='')value=null;body[field]=value;}if(row){for(const key of ['codigo','material_id','iam_user_id','fase','chave'])if(resource==='materiais-unidade'||resource==='usuarios-papeis'||resource==='flags'||resource==='parametros')delete body[key];}try{await data(`/cadastros/${resource}${row?'/'+encodeURIComponent(row.id||row.material_id):''}`,body,row?'PATCH':'POST');closeDrawer();toast('Cadastro salvo.');await loadResources();}catch(error){humanError(error);}};
  const toggle=document.getElementById('toggle-status');if(toggle)toggle.onclick=async()=>{try{await data(`/cadastros/${resource}/${row.id||row.material_id}/status`,{ativo:!row.ativo});closeDrawer();await loadResources();}catch(error){humanError(error);}};
}
function closeDrawer(){document.querySelector('.drawer')?.remove();document.querySelector('.drawer-backdrop')?.remove();}

async function init(){try{loading();const [me,centers]=await Promise.all([api('/me'),api('/cadastros/centros-custo?size=100')]);state.me=me;state.centers=centers.items;
  if(view==='painel')await loadPanel();else if(view==='solicitacoes')await loadRequestList();else if(view==='solicitacao')await loadDetail();else if(view==='nova')await loadNew();else if(view==='fornecedores'||view==='cadastros')await loadResources();else throw new Error('Tela não encontrada.');
}catch(error){showError(error);}}
init();
