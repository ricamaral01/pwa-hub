import {supDialog} from './dialog.js?v=1.4.3';
const ROOT='/unificado/suprimentos/';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Number(x||0).toLocaleString('pt-BR',{maximumFractionDigits:4});
const day=x=>x?String(x).slice(0,10).split('-').reverse().join('/'):'A definir';
const when=x=>x?new Date(x).toLocaleString('pt-BR'):'—';
const has=(me,r)=>me.papeis.some(x=>x.papel===r||x.papel==='ADMIN');
const field=(n,l,v='',type='text',extra='')=>`<label class="field"><span>${esc(l)}</span><input name="${esc(n)}" value="${esc(v)}" type="${type}" ${extra}></label>`;
const documentLine=(d,me)=>`<p>${when(d.confirmado_em)} · ${num(d.qtd)} · ${esc(d.destino)} · NF devolução ${esc(d.numero_nf_devolucao||'não informada')}</p>${has(me,'ALMOXARIFE')||has(me,'COMPRADOR')?`<button class="btn small" data-return-document="${d.id}">Informar/corrigir NF de devolução</button>`:''}`;

export async function orderTracking({app,me,api,send,id,reload,act}){
 const info=await api('/recebimento-acompanhamento/pedidos/'+id),po=info.pedido;
 const canAssign=has(me,'COMPRADOR')&&!info.recebimentos.some(x=>x.chegada_em)&&['RASCUNHO','EMITIDO','ENVIADO','REAPROVACAO'].includes(po.status);
 const canClose=has(me,'COMPRADOR')&&['ENVIADO','PARCIAL'].includes(po.status)&&info.itens.some(x=>Number(x.qtd_pendente)>0);
 const panel=document.createElement('section');panel.className='card sup-r3-tracking';
 panel.innerHTML=`<div class="tabs compact"><button class="tab" data-oc-tab="atribuicao">Atribuição e saldo</button><button class="tab active" data-oc-tab="recebimentos">Recebimentos</button></div><div id="oc-attribution" hidden><h2>Responsável pelo recebimento</h2><p>${esc(po.responsavel_recebimento_id||'Não atribuído')} · local ${esc(info.locais.find(x=>x.id===po.local_entrega_id)?.nome||'A definir')}</p>${canAssign?'<button class="btn" data-oc-assign>Alterar responsável, local e previsão</button>':''}<p>Alterações são auditadas e permitidas até a chegada conferida da primeira NF.</p></div><div id="oc-receipts"><h2>Recebimentos desta OC</h2><p>Situação: <strong>${esc(po.status_recebimento.replaceAll('_',' '))}</strong></p><div class="table-scroll"><table><thead><tr><th>Material</th><th>Pedido</th><th>Em conferência</th><th>Recebido</th><th>Pendente</th><th>Devolvido</th><th>Saldo encerrado</th><th>Previsão</th><th>Ação</th></tr></thead><tbody>${info.itens.map(x=>`<tr><td>${esc(x.descricao)}</td><td>${num(x.qtd)}</td><td>${num(x.qtd_em_conferencia)}</td><td>${num(x.qtd_recebida)}</td><td>${num(x.qtd_pendente)}</td><td>${num(x.qtd_devolvida)}</td><td>${num(x.qtd_cancelada_saldo)}</td><td>${day(x.data_prevista||po.entrega_prevista)}</td><td>${canClose&&Number(x.qtd_pendente)>0?`<button class="btn small" data-oc-close="${x.id}">Encerrar saldo</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>${canClose?'<button class="btn danger" data-oc-close="">Encerrar saldo residual da OC</button>':''}<h3>Histórico NF por NF</h3>${info.recebimentos.map(x=>`<article class="sup-rec-item"><h3><a href="${ROOT}recebimento/?id=${x.id}">NF ${esc(x.numero_nf)}</a> · ${esc(x.status)} · versão ${x.versao}</h3><p>${when(x.chegada_em||x.criado_em)} · conferida por ${esc(x.conferido_por||x.criado_por)} · inspeção ${esc(x.inspecao_status||'aguardando')}</p><p>${x.itens.map(i=>`${num(i.qtd_contada)} contado(s); devolvido na conferência ${num(i.qtd_devolvida_nf)}; ${Object.keys(i.divergencia||{}).map(k=>esc(k.replaceAll('_',' '))).join(', ')||'sem divergência registrada'}`).join('<br>')}</p><details><summary>Ver eventos e autoria</summary>${x.eventos.map(e=>`<p>${when(e.em)} · ${esc(e.por_nome)} · ${esc(e.para)}<br>${esc(e.comentario||'')}</p>`).join('')}</details></article>`).join('')||'<p>Nenhuma NF recebida ainda.</p>'}</div>`;
 app.querySelector('.page-head').after(panel);
 panel.querySelectorAll('[data-oc-tab]').forEach(b=>b.onclick=()=>{panel.querySelectorAll('[data-oc-tab]').forEach(x=>x.classList.toggle('active',x===b));panel.querySelector('#oc-attribution').hidden=b.dataset.ocTab!=='atribuicao';panel.querySelector('#oc-receipts').hidden=b.dataset.ocTab!=='recebimentos'});
 panel.querySelector('[data-oc-assign]')?.addEventListener('click',()=>act(async()=>{
  await supDialog({onSubmit:async f=>{const dates={};for(const item of info.itens)dates[item.id]=f.get(item.id);await send(`/recebimento-acompanhamento/pedidos/${id}/atribuicao`,{responsavel_recebimento_id:f.get('responsavel_recebimento_id'),local_entrega_id:f.get('local_entrega_id'),entrega_prevista:f.get('entrega_prevista'),datas_itens:dates},'PUT');await reload();},title:'Atribuir recebimento da '+po.numero,content:`<label class="field"><span>Almoxarife responsável</span><select name="responsavel_recebimento_id" required>${info.recebedores.map(uid=>`<option ${uid===po.responsavel_recebimento_id?'selected':''}>${esc(uid)}</option>`).join('')}</select></label><label class="field"><span>Local de entrega</span><select name="local_entrega_id" required>${info.locais.map(l=>`<option value="${l.id}" ${l.id===po.local_entrega_id?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></label>${field('entrega_prevista','Previsão da OC',po.entrega_prevista||'','date')}<h3>Previsão por item (vazio herda a OC)</h3>${info.itens.map(x=>field(x.id,x.descricao,x.data_prevista||'','date')).join('')}`});
 }));
 panel.querySelectorAll('[data-oc-close]').forEach(b=>b.onclick=()=>act(async()=>{
  await supDialog({onSubmit:async f=>{await send(`/recebimento-acompanhamento/pedidos/${id}/encerrar-saldo`,{item_id:b.dataset.ocClose||null,motivo:f.get('motivo')});await reload();},title:'Encerrar saldo residual',message:'A solicitação será avisada. Esta ação não confirma uma entrega nem apaga o pedido.',content:'<label class="field"><span>Motivo</span><textarea name="motivo" minlength="10" required></textarea></label>',danger:true});
 }));
}

async function agendaView(env){
 const {app,api,act}=env;const section=document.createElement('section');section.className='card sup-r3-agenda';
 section.innerHTML='<h2>Agenda de recebimentos</h2><div class="sup-rec-fields"><label class="field"><span>Período</span><select data-agenda-period><option value="semana">Semana e atrasados</option><option value="hoje">Hoje</option><option value="atrasados">Atrasados</option><option value="todos">Todos, inclusive sem previsão</option></select></label><label class="field"><span>Somente atribuídos a mim</span><input type="checkbox" data-agenda-mine></label></div><div data-agenda-content>Carregando…</div>';
 app.querySelector('.page-head').after(section);
 async function load(){
  const period=section.querySelector('[data-agenda-period]').value,mine=section.querySelector('[data-agenda-mine]').checked;
  const data=await api(`/recebimento-acompanhamento/agenda?periodo=${period}&atribuidos_a_mim=${mine}`);
  let previous='';section.querySelector('[data-agenda-content]').innerHTML=data.items.map(x=>{const group=previous!==x.razao?`<h3>${esc(x.razao)}</h3>`:'';previous=x.razao;return group+`<article class="sup-rec-item ${x.parou_producao?'sup-r3-urgent':''}"><div class="section-head"><strong>${esc(x.numero)}</strong><span class="badge ${x.atrasado?'stopped':'wait'}">${x.atrasado?'Atrasado':'Previsto'} · ${day(x.data_prevista)}</span></div><p>${x.itens_pendentes} item(ns) · pendente ${num(x.qtd_pendente)} · responsável ${esc(x.responsavel_recebimento_id||'não atribuído')}</p>${x.parou_producao?'<p><strong>PAROU PRODUÇÃO · prioridade</strong></p>':''}<div class="sup-rec-actions"><a class="btn primary" href="${ROOT}recebimento/?pedido=${encodeURIComponent(x.numero)}">Receber este pedido</a><a class="btn" href="${ROOT}cotacoes/?tab=pedido&id=${x.id}">Abrir OC e recebimentos</a></div></article>`}).join('')||'<p>Nenhum pedido neste filtro.</p>';
 }
 section.querySelectorAll('select,input').forEach(x=>x.onchange=()=>act(load));await load();
 const pending=(await api('/recebimento-acompanhamento/devolucoes')).items.filter(x=>x.status==='PENDENTE');
 if(pending.length){const box=document.createElement('section');box.className='card';box.innerHTML=`<h2>Devoluções aguardando registro</h2><p>${pending.length} item(ns) reprovados aguardam a devolução física e a escolha Repor/Abater.</p>${pending.map(x=>`<p><a href="${ROOT}recebimento/?id=${x.recebimento_id}">Abrir NF · ${num(x.qtd)} · ${esc(x.motivo)}</a></p>`).join('')}`;app.append(box)}
}

async function returnView(env){
 const {app,row,me,api,send,reload,act}=env;if(!row||row.status==='ESTORNADO')return;
 const all=(await api('/recebimento-acompanhamento/devolucoes?recebimento_id='+row.id)).items;
 const reverse=app.querySelector('[data-do=reverse]');
 if(reverse&&all.some(x=>x.status==='CONCLUIDA')){reverse.disabled=true;reverse.textContent='Estorno indisponível: devolução registrada';}
 const box=document.createElement('section');box.className='card sup-r3-returns';
 box.innerHTML=`<h2>Devoluções vinculadas à OC e NF</h2><p>Repor devolve a quantidade ao pendente. Abater encerra a parcela do pedido. Informe a NF de devolução quando existir.</p>${row.itens.map(x=>{const completed=all.filter(d=>d.recebimento_item_id===x.id&&d.status==='CONCLUIDA'),returned=completed.reduce((n,d)=>n+Number(d.qtd),0),pending=all.find(d=>d.recebimento_item_id===x.id&&d.status==='PENDENTE');return `<article class="sup-rec-item"><h3>${esc(x.descricao)}</h3><p>Contado ${num(x.qtd_contada)} · devolvido ${num(returned)} ${pending?'· devolução pendente '+num(pending.qtd):''}</p>${completed.map(d=>documentLine(d,me)).join('')}${has(me,'ALMOXARIFE')&&Number(x.qtd_contada)>returned?`<button class="btn danger" data-return-item="${x.id}">${pending?'Confirmar devolução pendente':'Registrar devolução'}</button>`:''}</article>`}).join('')}`;
 app.querySelector('#receipt-content').append(box);
 box.querySelectorAll('[data-return-document]').forEach(b=>b.onclick=()=>act(async()=>{
  const entry=all.find(x=>x.id===b.dataset.returnDocument);
  await supDialog({title:'Documento da devolução',content:field('numero_nf_devolucao','Número da NF de devolução',entry.numero_nf_devolucao||'','text','required maxlength="40"')+field('motivo','Motivo da informação/correção','','text',entry.numero_nf_devolucao?'required minlength="10"':''),
    onSubmit:async f=>{await send('/recebimento-acompanhamento/devolucoes/'+entry.id+'/documento',Object.fromEntries(f));await reload()}});
 }));
 box.querySelectorAll('[data-return-item]').forEach(b=>b.onclick=()=>act(async()=>{
  const line=row.itens.find(x=>x.id===b.dataset.returnItem),pending=all.find(d=>d.recebimento_item_id===line.id&&d.status==='PENDENTE');
  const returned=all.filter(d=>d.recebimento_item_id===line.id&&d.status==='CONCLUIDA').reduce((s,d)=>s+Number(d.qtd),0);
  await supDialog({onSubmit:async f=>{await send('/recebimento-acompanhamento/itens/'+line.id+'/devolver',{...Object.fromEntries(f),chave_idempotencia:pending?.chave_idempotencia||crypto.randomUUID()});await reload();},title:'Devolver · '+line.descricao,danger:true,content:field('qtd','Quantidade devolvida',pending?.qtd||Number(line.qtd_contada)-returned,'number',`min="0.0001" step="0.0001" ${pending?'readonly':''}`)+`<label class="field"><span>Destino do saldo da OC</span><select name="destino"><option value="REPOR">Repor · volta ao pendente</option><option value="ABATER">Abater · cancela saldo</option></select></label>`+field('numero_nf_devolucao','Número da NF de devolução (se houver)')+`<label class="field"><span>Motivo</span><textarea name="motivo" minlength="10" required>${esc(pending?.motivo||'')}</textarea></label>`});
 }));
}

window.supRecebimentoExtension=async env=>{if(env.kind==='list')await agendaView(env);else await returnView(env)};
