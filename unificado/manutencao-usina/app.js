import {purchaseStatuses,purchaseOf,eligible,isOpen,isPurchasePending,isWaiting,summarize,dashboardMarkup} from './dashboard.js?v=20261113-painel1';
import {galleryMarkup,showPhoto,photoViewerOpen,closePhotoViewer} from './photos.js?v=20261113-fotos1';
const API='/unificado/mapa/api/tools/manutencao-usina';
const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups={M1:'Misturador 1',M2:'Misturador 2',COMUM:'Áreas comuns'};
const statuses=['Não iniciado','Aguardando material','Em andamento','Concluído','Cancelado'];
const critClass=value=>value==='Alta'?'high':value==='Média'?'medium':'low';
const dateText=value=>value?value.slice(0,10).split('-').reverse().join('/'):'A definir';
const timeText=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'';
const dayValue=value=>Date.parse(value+'T00:00:00Z');
const isoDay=value=>new Date(value).toISOString().slice(0,10);
const state={rows:[],config:null,canEdit:false,view:'dashboard',loaded:false,loading:false,controller:null,dialog:null,ganttStart:null,ganttWeeks:26};
let previousFocus=null,modalCleanup=null;

async function api(path='',options={}){
  const headers=new Headers(options.headers);if(options.body)headers.set('Content-Type','application/json');
  const controller=new AbortController();const cancel=()=>controller.abort();
  if(options.signal?.aborted)controller.abort();
  options.signal?.addEventListener('abort',cancel,{once:true});
  const timer=options.method?null:setTimeout(cancel,15000);
  try{
    const response=await fetch(API+path,{...options,headers,credentials:'same-origin',cache:'no-store',signal:controller.signal});
    const value=await response.json();if(!response.ok){const error=new Error(value.error||'Não foi possível salvar.');error.status=response.status;throw error}return value;
  }catch(error){if(controller.signal.aborted&&!options.signal?.aborted)throw new Error('A conexão demorou a responder. Tente atualizar novamente.');throw error}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel)}
}
function message(text,bad=false){const node=$(bad?'error':'notice');node.textContent=text;node.hidden=!text}
async function load({quiet=false}={}){
  state.controller?.abort();const controller=new AbortController();state.controller=controller;state.loading=true;
  if(!quiet){$('refresh').disabled=true;$('refresh').textContent='Atualizando…'}
  if(!state.loaded)$('loading').hidden=false;
  try{
    const value=await api('',{signal:controller.signal});if(controller.signal.aborted)return;
    state.rows=value.rows;state.config=value.config;state.canEdit=value.can_edit;state.loaded=true;
    $('new').hidden=!state.canEdit;$('config').hidden=!state.canEdit;
    $('policy').textContent=state.canEdit?'Você pode cadastrar e atualizar as atividades. Todos os usuários do Unificado podem acompanhar.':'Você está visualizando o acompanhamento. A edição está disponível aos gestores.';
    $('sync').textContent='Conferido às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})+' · atualização automática a cada 30 segundos.';
    message('',true);render();
  }catch(error){if(!controller.signal.aborted)message(error.message,true)}
  finally{if(!controller.signal.aborted){state.loading=false;$('loading').hidden=true;$('refresh').disabled=false;$('refresh').textContent='Atualizar'}}
}
function visibleRows(){
  const search=$('search').value.trim().toLocaleLowerCase('pt-BR');
  return state.rows.filter(row=>{
    if($('group').value&&row.grupo!==$('group').value)return false;
    if($('criticality').value&&row.criticidade!==$('criticality').value)return false;
    if($('status').value&&row.status!==$('status').value)return false;
    if($('purchase-filter').value&&purchaseOf(row)!==$('purchase-filter').value)return false;
    const attention=$('attention').value;
    if(attention==='excluded'){if(row.aplicacao!=='Não se aplica')return false}
    else if(row.aplicacao==='Não se aplica')return false;
    if(attention==='no-date'&&row.inicio&&row.fim_previsto)return false;
    if(attention==='late'&&!row.alertas.length)return false;
    if(attention==='confirm'&&row.aplicacao!=='Pendente de confirmação')return false;
    if(attention==='open'&&!isOpen(row))return false;
    if(attention==='purchase'&&!isPurchasePending(row))return false;
    if(attention==='waiting'&&!isWaiting(row))return false;
    return !search||[row.codigo,row.atividade,row.sistema,row.responsavel,row.material_servico,row.observacao,...row.campos_adicionais.flatMap(field=>[field.nome,field.valor])].join(' ').toLocaleLowerCase('pt-BR').includes(search);
  });
}
function badge(row){return `<span class="badge ${critClass(row.criticidade)}">${escape(row.criticidade)}</span>`}
function progress(row){return `<div class="progress-line"><div class="progress" role="progressbar" aria-label="Conclusão de ${escape(row.codigo)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${row.percentual}"><span style="width:${row.percentual}%"></span></div><b>${row.percentual}%</b></div>`}
function flags(row){return `${row.aplicacao==='Pendente de confirmação'?'<span class="flag confirm">Confirmar misturador</span>':''}${row.alertas.map(value=>`<span class="flag late">${escape(value)}</span>`).join('')}`}
function action(row){return `<div class="activity-actions"><button class="open-activity" data-open="${row.id}">${state.canEdit?'Atualizar':'Ver detalhes'}</button>${row.fotos_count?`<button class="open-photos" data-open-photos="${row.id}">Fotos (${row.fotos_count})</button>`:''}</div>`}
function render(){
  const rows=visibleRows(),summary=summarize(rows),active=summary.active;
  const stats=[['Abertas',summary.open.length],['Concluídas',summary.done.length],['Pendentes de compra',summary.purchase.length],['Aguardando material',summary.waiting.length],['Com alerta',active.filter(row=>row.alertas.length).length]];
  $('summary').innerHTML=stats.map(([label,value])=>`<article><span>${label}</span><strong>${value}</strong></article>`).join('');
  $('result-count').textContent=`${rows.length} de ${state.rows.length} atividades`;
  $('table-tab').setAttribute('aria-pressed',String(state.view==='table'));$('gantt-tab').setAttribute('aria-pressed',String(state.view==='gantt'));
  $('dashboard-tab').setAttribute('aria-pressed',String(state.view==='dashboard'));
  const filterCount=['group','criticality','status','attention','purchase-filter'].filter(id=>$(id).value).length;
  $('filter-count').textContent=filterCount?`· ${filterCount} ativo(s)`:'';
  if(state.view==='dashboard'){$('content').innerHTML=dashboardMarkup(rows,{escape,groups,gantt:ganttMarkup});return}
  if(!rows.length){$('content').innerHTML='<div class="empty"><h2>Nenhuma atividade com estes filtros</h2><p>Altere a busca ou use “Limpar filtros”.</p></div>';return}
  if(state.view==='gantt'){renderGantt(rows);return}
  $('content').innerHTML=`<div class="table-wrap"><table class="activity-table"><caption class="sr-only">Acompanhamento das correções da usina</caption><thead><tr><th>Atividade</th><th>Criticidade</th><th>Responsável</th><th>Início previsto</th><th>Fim previsto</th><th>Prazo limite</th><th>Status e conclusão</th><th><span class="sr-only">Ação</span></th></tr></thead><tbody>${rows.map(row=>`<tr><td class="activity-cell"><span class="code">${escape(row.codigo)} · ${groups[row.grupo]}</span><strong>${escape(row.atividade)}</strong><small>${escape(row.sistema)}</small><div class="flags">${flags(row)}</div></td><td>${badge(row)}</td><td>${escape(row.responsavel)||'<span class="muted">A definir</span>'}</td><td>${dateText(row.inicio)}</td><td>${dateText(row.fim_previsto)}</td><td>${dateText(row.prazo_limite)}</td><td><span class="status-label">${escape(row.status)}</span><small class="purchase-status-label">Compra: ${escape(purchaseOf(row))}</small>${progress(row)}</td><td>${action(row)}</td></tr>`).join('')}</tbody></table></div>
  <div class="activity-cards">${rows.map(row=>`<article class="activity-card"><div class="card-top"><span class="code">${escape(row.codigo)} · ${groups[row.grupo]}</span>${badge(row)}</div><h2>${escape(row.atividade)}</h2><p>${escape(row.sistema)}</p><div class="flags">${flags(row)}</div><dl><div><dt>Responsável</dt><dd>${escape(row.responsavel)||'A definir'}</dd></div><div><dt>Previsto</dt><dd>${dateText(row.inicio)} → ${dateText(row.fim_previsto)}</dd></div><div><dt>Prazo limite</dt><dd>${dateText(row.prazo_limite)}</dd></div></dl><div class="card-bottom"><span>${escape(row.status)}</span>${action(row)}</div><p class="purchase-status-label">Compra: ${escape(purchaseOf(row))}</p>${progress(row)}</article>`).join('')}</div>`;
}
function renderGantt(rows){$('content').innerHTML=ganttMarkup(rows)}
function ganttMarkup(rows){
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  let start=state.ganttStart||state.config?.inicio_cronograma;
  if(!start){const date=new Date(dayValue(today));date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);start=isoDay(date.getTime())}
  const startMs=dayValue(start),dayMs=86400000,span=state.ganttWeeks*7;
  const weekLabel=Array.from({length:state.ganttWeeks},(_,i)=>`<span><b>S${i+1}</b>${dateText(isoDay(startMs+i*7*dayMs)).slice(0,5)}</span>`).join('');
  const pct=value=>Math.max(0,Math.min(100,value/span*100));
  const bars=row=>{
    let html='';
    if(row.inicio&&row.fim_previsto){
      const from=(dayValue(row.inicio)-startMs)/dayMs,to=(dayValue(row.fim_previsto)-startMs)/dayMs+1;
      if(to>0&&from<span)html+=`<div class="gantt-bar ${critClass(row.criticidade)}" style="left:${pct(from)}%;width:${Math.max(.2,pct(to)-pct(from))}%" title="Previsto: ${dateText(row.inicio)} a ${dateText(row.fim_previsto)}"><span style="width:${row.percentual}%"></span><b>${row.percentual}%</b></div>`;
      else html+='<small class="out-of-range">Previsto fora do período exibido</small>';
    }else html+='<small class="out-of-range">Sem data prevista</small>';
    if(row.inicio_real){const from=(dayValue(row.inicio_real)-startMs)/dayMs,to=(dayValue(row.fim_real||row.inicio_real)-startMs)/dayMs+1;if(to>0&&from<span)html+=`<div class="actual-bar" style="left:${pct(from)}%;width:${Math.max(.3,pct(to)-pct(from))}%" title="Realizado: ${dateText(row.inicio_real)}${row.fim_real?' a '+dateText(row.fim_real):' · fim não informado'}"></div>`}
    if(row.prazo_limite){const deadline=(dayValue(row.prazo_limite)-startMs)/dayMs;if(deadline>=0&&deadline<span)html+=`<span class="deadline-marker" style="left:${pct(deadline)}%" title="Prazo limite: ${dateText(row.prazo_limite)}"></span>`}
    return html;
  };
  return `<div class="gantt-navigation"><div><button data-gantt-shift="-28" aria-label="Ver quatro semanas anteriores">← 4 semanas</button><button data-gantt-today>Hoje</button><button data-gantt-shift="28" aria-label="Ver quatro semanas seguintes">4 semanas →</button><button data-gantt-reset>Início cadastrado</button></div><label>Período<select data-gantt-weeks aria-label="Semanas no Gantt">${[13,26,52].map(value=>`<option value="${value}"${state.ganttWeeks===value?' selected':''}>${value} semanas</option>`).join('')}</select></label></div><p class="gantt-note">${state.ganttWeeks} semanas a partir de ${dateText(start)}. ${state.config?.inicio_cronograma?'':'Início ainda não definido: esta janela de visualização não altera as datas das atividades.'}</p><div class="gantt-legend"><span class="legend-high">Alta</span><span class="legend-medium">Média</span><span class="legend-low">Baixa</span><span class="legend-actual">Realizado</span><span>│ Prazo limite</span></div><div class="gantt-scroll" tabindex="0" aria-label="Gantt. Role horizontalmente para ver as próximas semanas."><div class="gantt-grid" style="--week-count:${state.ganttWeeks};--track-width:${state.ganttWeeks*72}px"><div class="gantt-header"><strong>Atividade</strong><div class="gantt-weeks">${weekLabel}</div></div>${rows.map(row=>`<div class="gantt-row"><button class="gantt-title" data-open="${row.id}"><span class="code">${escape(row.codigo)} · ${groups[row.grupo]}</span><strong>${escape(row.atividade)}</strong><small>${escape(row.status)} · ${escape(row.responsavel)||'Responsável a definir'}</small></button><div class="gantt-track">${bars(row)}</div></div>`).join('')}</div></div>`;
}
function closeModal(){if(state.dialog?.saving)return;closePhotoViewer();state.dialog?.photoController?.abort();modalCleanup?.();modalCleanup=null;$('modal-host').replaceChildren();state.dialog=null;previousFocus?.focus()}
function showModal(title,html){
  closeModal();previousFocus=document.activeElement;
  $('modal-host').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${escape(title)}"><header class="modal-head"><div><h2>${escape(title)}</h2></div><button class="modal-close" aria-label="Fechar">×</button></header>${html}</section></div>`;
  const dialog=$('modal-host').querySelector('.modal'),oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const controls=()=>[...dialog.querySelectorAll('button,input,textarea,select,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
  const key=event=>{if(photoViewerOpen())return;if(event.key==='Escape'){event.preventDefault();closeModal()}if(event.key==='Tab'){const items=controls(),first=items[0],last=items.at(-1);if(!dialog.contains(document.activeElement)){event.preventDefault();first?.focus()}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}};
  document.addEventListener('keydown',key);dialog.querySelector('.modal-close').onclick=closeModal;
  $('modal-host').querySelector('.modal-backdrop').onclick=event=>{if(event.target===event.currentTarget)closeModal()};
  modalCleanup=()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',key)};
  (dialog.querySelector('[autofocus]')||dialog.querySelector('.modal-close')).focus();
}
const option=(value,label,selected)=>`<option value="${escape(value)}"${value===selected?' selected':''}>${escape(label)}</option>`;
function extraRows(fields){return fields.map(field=>`<div class="extra-row"><label>Nome da informação<input data-extra-name maxlength="100" value="${escape(field.nome)}" placeholder="Ex.: fornecedor"></label><label>Informação<input data-extra-value maxlength="3000" value="${escape(field.valor)}"></label><button type="button" data-remove-extra aria-label="Remover informação">×</button></div>`).join('')}
function openActivity(id=null,focusPhotos=false){
  const row=id?state.rows.find(value=>value.id===id):{grupo:'M1',criticidade:'Média',status:'Não iniciado',percentual:0,aplicacao:'Aplicável',campos_adicionais:[]};
  if(!row)return;
  showModal(id?`${row.codigo} · ${state.canEdit?'Atualizar atividade':'Detalhes'}`:'Nova atividade',`
    <form id="activity-form"><div class="modal-body"><p class="form-intro">Preencha as datas e registre o que está sendo feito. Campos sem informação podem ficar em branco.</p><div id="form-error" role="alert" class="error" hidden></div>
    <fieldset id="fields"${state.canEdit?'':' disabled'}><label>Atividade <span aria-hidden="true">*</span><textarea name="atividade" maxlength="3000" required autofocus>${escape(row.atividade)}</textarea></label>
    <div class="form-grid three"><label>Local<select name="grupo">${Object.entries(groups).map(([value,label])=>option(value,label,row.grupo)).join('')}</select></label><label>Criticidade<select name="criticidade">${['Alta','Média','Baixa'].map(value=>option(value,value,row.criticidade)).join('')}</select></label><label>Aplicação<select name="aplicacao">${['Aplicável','Pendente de confirmação','Não se aplica'].map(value=>option(value,value,row.aplicacao)).join('')}</select></label></div>
    <div class="form-grid"><label>Sistema / equipamento<input name="sistema" maxlength="160" value="${escape(row.sistema)}"></label><label>Responsável / equipe<input name="responsavel" maxlength="200" value="${escape(row.responsavel)}" placeholder="Nome da pessoa, equipe ou empresa"></label></div>
    <h3>Planejamento</h3><div class="form-grid four"><label>Início previsto<input name="inicio" type="date" value="${escape(row.inicio)}"></label><label>Duração em dias corridos<input name="duracao_dias" type="number" min="1" max="3650" step="1" value="${row.duracao_dias??''}"></label><label>Fim previsto <small>calculado</small><input id="calculated-end" readonly value="${row.fim_previsto?dateText(row.fim_previsto):'A definir'}"></label><label>Prazo limite<input name="prazo_limite" type="date" value="${escape(row.prazo_limite)}"></label></div>
    <h3>Execução</h3><div class="form-grid four"><label>Status<select name="status">${statuses.map(value=>option(value,value,row.status)).join('')}</select></label><label>Conclusão (%)<input name="percentual" type="number" min="0" max="100" step="1" value="${row.percentual}"></label><label>Início realizado<input name="inicio_real" type="date" value="${escape(row.inicio_real)}"></label><label>Fim realizado<input name="fim_real" type="date" value="${escape(row.fim_real)}"></label></div>
    <h3>Materiais e serviços</h3><label>Situação da compra<select name="situacao_compra">${purchaseStatuses.map(value=>option(value,value,purchaseOf(row))).join('')}</select></label><label>Material / serviço<textarea name="material_servico" maxlength="4000">${escape(row.material_servico)}</textarea></label><div class="form-grid"><label>Quantidade<input name="quantidade" type="number" min="0" max="999999999.999" step="0.001" value="${row.quantidade??''}"></label><label>Unidade de medida<input name="unidade" maxlength="40" value="${escape(row.unidade)}" placeholder="Ex.: peça, metro, serviço"></label></div>
    <label>Observações<textarea name="observacao" maxlength="12000">${escape(row.observacao)}</textarea></label><label>Referência / slide<input name="ref_slide" maxlength="100" value="${escape(row.ref_slide)}"></label>
    <h3>Informações adicionais</h3><p class="muted">Acrescente fornecedor, pedido, custo, link ou qualquer informação útil à equipe.</p><div id="extra-fields">${extraRows(row.campos_adicionais)}</div>${state.canEdit?'<button type="button" id="add-extra">+ Adicionar informação</button>':''}</fieldset>
    ${id?'<section class="activity-photo-section"><h3>Fotos da inspeção</h3><div id="activity-photos" aria-live="polite"><p role="status">Carregando fotos do relatório…</p></div></section>':''}
    ${id?`<p class="last-update">Última atualização: ${escape(row.atualizado_por_nome)} · ${timeText(row.atualizado_em)}</p><section class="history-section"><h3>Andamentos e histórico</h3>${state.canEdit?'<label>Registrar uma atualização<textarea id="progress-note" maxlength="6000" placeholder="Ex.: material recebido; troca agendada para amanhã."></textarea></label><button type="button" id="save-note">Registrar andamento</button>':''}<div id="history" aria-live="polite">Carregando histórico…</div></section>`:''}
    </div><footer class="modal-actions"><button type="button" id="cancel">${state.canEdit?'Cancelar':'Fechar'}</button>${id?'<button type="button" id="reload-row">Recarregar atividade</button>':''}${state.canEdit?'<button class="primary" type="submit" id="save">Salvar atividade</button>':''}</footer></form>`);
  state.dialog={row,id,key:crypto.randomUUID(),saving:false};
  $('cancel').onclick=closeModal;
  $('activity-form').onsubmit=saveActivity;
  const form=$('activity-form');
  const calculate=()=>{const start=form.elements.inicio.value,duration=Number(form.elements.duracao_dias.value);$('calculated-end').value=start&&duration>0?dateText(isoDay(dayValue(start)+(duration-1)*86400000)):'A definir'};
  form.elements.inicio.oninput=calculate;form.elements.duracao_dias.oninput=calculate;
  form.elements.status.onchange=()=>{if(form.elements.status.value==='Concluído')form.elements.percentual.value='100'};
  $('add-extra')?.addEventListener('click',()=>{if($('extra-fields').children.length>=20){formError('Use até 20 informações adicionais.');return}$('extra-fields').insertAdjacentHTML('beforeend',extraRows([{nome:'',valor:''}]));$('extra-fields').lastElementChild.querySelector('input').focus()});
  $('extra-fields').onclick=event=>{if(event.target.closest('[data-remove-extra]'))event.target.closest('.extra-row').remove()};
  if(id){void loadPhotos(id,focusPhotos);$('activity-photos').onclick=event=>{const button=event.target.closest('[data-photo-index]');if(button&&state.dialog?.photos)showPhoto(state.dialog.photos,Number(button.dataset.photoIndex))};$('reload-row').onclick=async()=>{if(confirm('Recarregar a versão atual? O preenchimento ainda não salvo será descartado.')){await load();openActivity(id)}};void loadHistory(id);$('save-note')?.addEventListener('click',saveNote)}
}
async function loadPhotos(id,focusPhotos=false){
  const dialog=state.dialog;if(!dialog)return;
  dialog.photoController?.abort();const controller=new AbortController();dialog.photoController=controller;
  try{
    const value=await api('/'+id+'/fotos',{signal:controller.signal});if(state.dialog!==dialog||controller.signal.aborted)return;
    dialog.photos=value.rows;$('activity-photos').innerHTML=galleryMarkup(value,{escape,dateText});
    if(focusPhotos)$('activity-photos').scrollIntoView({block:'start'});
  }catch(error){
    if(state.dialog!==dialog||controller.signal.aborted)return;
    $('activity-photos').innerHTML=`<p class="error">${escape(error.message)}</p><button type="button" id="retry-photos">Tentar carregar as fotos novamente</button>`;
    $('retry-photos').onclick=()=>void loadPhotos(id,focusPhotos);
  }
}
function formError(text){$('form-error').textContent=text;$('form-error').hidden=!text;if(text)$('form-error').scrollIntoView({block:'nearest'})}
function saving(value){state.dialog.saving=value;for(const button of $('modal-host').querySelectorAll('button'))button.disabled=value;$('fields')?.toggleAttribute('disabled',value||!state.canEdit);if($('save'))$('save').textContent=value?'Salvando…':'Salvar atividade'}
async function saveActivity(event){
  event.preventDefault();if(!state.canEdit||state.dialog.saving)return;
  const form=event.currentTarget,body=Object.fromEntries(new FormData(form));
  body.versao=state.dialog.row.versao;body.chave_criacao=state.dialog.key;
  for(const field of ['inicio','prazo_limite','inicio_real','fim_real'])body[field]=body[field]||null;
  body.duracao_dias=body.duracao_dias?Number(body.duracao_dias):null;body.percentual=Number(body.percentual);body.quantidade=body.quantidade||null;
  body.campos_adicionais=[...$('extra-fields').children].map(node=>({nome:node.querySelector('[data-extra-name]').value,valor:node.querySelector('[data-extra-value]').value}));
  formError('');saving(true);
  try{await api(state.dialog.id?'/'+state.dialog.id:'',{method:state.dialog.id?'PUT':'POST',body:JSON.stringify(body)});saving(false);closeModal();await load();message('Atividade salva. A equipe já pode acompanhar a atualização.')}
  catch(error){saving(false);formError(error.message)}
}
async function loadHistory(id){
  try{const value=await api('/'+id+'/historico');if(state.dialog?.id!==id)return;$('history').innerHTML=value.rows.length?value.rows.map(row=>{const changed=row.tipo==='alterada'?Object.keys(row.depois||{}).filter(key=>!['versao','atualizado_em','atualizado_por','atualizado_por_nome'].includes(key)&&JSON.stringify(row.antes?.[key])!==JSON.stringify(row.depois?.[key])):[];return `<article class="history-item"><strong>${escape(row.autor_nome)}</strong><time>${timeText(row.criado_em)}</time><p>${escape(row.texto||({importada:'Atividade importada da planilha.',criada:'Atividade cadastrada.',alterada:'Atividade atualizada.'}[row.tipo]||row.tipo))}</p>${changed.length?`<details><summary>Ver alterações</summary><dl>${changed.map(key=>`<div><dt>${escape(fieldLabel(key))}</dt><dd>${escape(displayChange(row.antes?.[key]))} → ${escape(displayChange(row.depois?.[key]))}</dd></div>`).join('')}</dl></details>`:''}</article>`}).join(''):'Nenhuma atualização registrada.'}
  catch(error){if(state.dialog?.id===id)$('history').textContent=error.message}
}
function fieldLabel(key){return ({grupo:'Local',criticidade:'Criticidade',sistema:'Sistema',atividade:'Atividade',ref_slide:'Referência',observacao:'Observações',responsavel:'Responsável',material_servico:'Material / serviço',quantidade:'Quantidade',unidade:'Unidade',inicio:'Início previsto',duracao_dias:'Duração (dias)',prazo_limite:'Prazo limite',status:'Status',percentual:'Conclusão (%)',inicio_real:'Início realizado',fim_real:'Fim realizado',aplicacao:'Aplicação',campos_adicionais:'Informações adicionais',situacao_compra:'Situação da compra'})[key]||key}
function displayChange(value){if(value===null||value==='')return 'Não informado';if(Array.isArray(value))return value.map(field=>`${field.nome}: ${field.valor}`).join('; ');return groups[value]||value}
async function saveNote(){
  if(state.dialog.saving)return;const text=$('progress-note').value.trim();if(!text){formError('Escreva o andamento antes de registrar.');return}
  formError('');saving(true);
  try{const row=await api('/'+state.dialog.id+'/andamentos',{method:'POST',body:JSON.stringify({texto:text,versao:state.dialog.row.versao})});state.dialog.row.versao=row.versao;$('progress-note').value='';saving(false);void loadHistory(row.id);await load({quiet:true})}
  catch(error){saving(false);formError(error.message)}
}
function openConfig(){
  showModal('Início do cronograma',`<form id="config-form"><div class="modal-body"><p>A data define a primeira das 26 semanas do cronograma. As datas das atividades continuam sendo preenchidas individualmente.</p><div id="config-error" role="alert" class="error" hidden></div><label>Data inicial<input type="date" id="schedule-start" value="${escape(state.config.inicio_cronograma)}" autofocus></label></div><footer class="modal-actions"><button type="button" id="cancel-config">Cancelar</button><button class="primary" id="save-config">Salvar início</button></footer></form>`);
  state.dialog={saving:false};$('cancel-config').onclick=closeModal;
  $('config-form').onsubmit=async event=>{event.preventDefault();if(state.dialog.saving)return;state.dialog.saving=true;$('save-config').disabled=true;try{await api('/configuracao',{method:'PUT',body:JSON.stringify({versao:state.config.versao,inicio_cronograma:$('schedule-start').value||null})});state.dialog.saving=false;closeModal();await load();message('Início do cronograma atualizado.')}catch(error){state.dialog.saving=false;$('save-config').disabled=false;$('config-error').textContent=error.message;$('config-error').hidden=false}};
}
let searchTimer;
const filterMedia=matchMedia('(min-width:701px)');$('filter-details').open=filterMedia.matches;
filterMedia.addEventListener('change',()=>{$('filter-details').open=filterMedia.matches});
$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(render,120)};
for(const id of ['group','criticality','status','attention','purchase-filter'])$(id).onchange=render;
$('clear').onclick=()=>{for(const id of ['search','group','criticality','status','attention','purchase-filter'])$(id).value='';render()};
$('dashboard-tab').onclick=()=>{state.view='dashboard';render()};
$('table-tab').onclick=()=>{state.view='table';render()};$('gantt-tab').onclick=()=>{state.view='gantt';render()};
$('refresh').onclick=()=>void load();$('new').onclick=()=>openActivity();$('config').onclick=openConfig;
$('content').onclick=event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.openPhotos){openActivity(Number(button.dataset.openPhotos),true);return}
  if(button.dataset.open){openActivity(Number(button.dataset.open));return}
  if(button.hasAttribute('data-full-gantt')){state.view='gantt';render();return}
  if(button.hasAttribute('data-gantt-shift')){
    const noteStart=state.ganttStart||state.config?.inicio_cronograma||currentMonday();
    state.ganttStart=isoDay(dayValue(noteStart)+Number(button.dataset.ganttShift)*86400000);render();return;
  }
  if(button.hasAttribute('data-gantt-today')){state.ganttStart=currentMonday();render();return}
  if(button.hasAttribute('data-gantt-reset')){state.ganttStart=null;render();return}
  if(button.hasAttribute('data-dashboard-status')){$('status').value=button.dataset.dashboardStatus;$('attention').value='';if(button.dataset.dashboardStatus==='Concluído')$('purchase-filter').value=''}
  else if(button.hasAttribute('data-dashboard-attention')){$('attention').value=button.dataset.dashboardAttention;$('status').value='';$('purchase-filter').value=''}
  else if(button.hasAttribute('data-dashboard-purchase')){$('purchase-filter').value=button.dataset.dashboardPurchase;$('attention').value='open';$('status').value=''}
  else if(button.hasAttribute('data-dashboard-group')){$('group').value=button.dataset.dashboardGroup}
  else return;
  state.view='table';render();$('content').scrollIntoView({block:'start'});
};
$('content').onchange=event=>{if(event.target.matches('[data-gantt-weeks]')){state.ganttWeeks=Number(event.target.value);render()}};
function currentMonday(){const date=new Date(dayValue(new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})));date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return isoDay(date.getTime())}

setInterval(()=>{if(!document.hidden&&!state.dialog&&!state.loading)void load({quiet:true})},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!state.dialog)void load({quiet:true})});
void load();
