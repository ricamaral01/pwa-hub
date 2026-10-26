/* Telas S3-A: fornecedores, cotações e pedidos. Escopo exclusivo do módulo. */
import {supAsk, supDialog} from './dialog.js';
const API='/api/suprimentos', ROOT='/unificado/suprimentos/';
const app=document.querySelector('#app');
const page=location.pathname.split('/').filter(Boolean).pop();
const query=new URLSearchParams(location.search);
let me, suppliers=[], quote, order, viewTab=query.get('tab')||'fila';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=x=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(x||0));
const asDate=x=>new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(x))?x+'T12:00:00':x);
const date=x=>x&&!Number.isNaN(asDate(x).getTime())?asDate(x).toLocaleDateString('pt-BR'):'—';
const dateTime=x=>x&&!Number.isNaN(asDate(x).getTime())?asDate(x).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
const address=x=>[x?.logradouro,x?.cidade,x?.uf].filter(Boolean).join(' · ')||'—';
const contacts=x=>[['Comercial',x?.comercial],['Financeiro',x?.financeiro],['Qualidade',x?.qualidade]].filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ')||'—';
const badge=x=>`<span class="badge ${['HOMOLOGADO','RECEBIDO','ENCERRADO','FECHADA'].includes(x)?'ok':['REPROVADO','BLOQUEADO','CANCELADO'].includes(x)?'stopped':'wait'}">${esc(String(x||'—').replaceAll('_',' '))}</span>`;
const notice=x=>{const n=document.createElement('div');n.className='toast';n.textContent=x;document.body.append(n);setTimeout(()=>n.remove(),4500)};
async function api(path,opt={},retry=true){
  const h={...opt.headers};if(opt.body&&!(opt.body instanceof FormData))h['Content-Type']='application/json';
  const r=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...opt,headers:h});
  if(r.status===401&&retry){const renew=await fetch(ROOT+'session-renew',{credentials:'same-origin',cache:'no-store'}).catch(()=>null);if(renew?.ok)return api(path,opt,false)}
  if(!r.ok){const body=await r.json().catch(()=>({}));throw Error(body.detail||`Falha ${r.status}`)}
  if(r.headers.get('content-type')?.includes('application/pdf'))return r.blob();
  return r.json();
}
const send=(p,b,m='POST')=>api(p,{method:m,body:JSON.stringify(b)});
const has=r=>me?.papeis?.some(x=>x.papel===r||x.papel==='ADMIN');
const canApprove=()=>me?.papeis?.some(x=>x.papel==='APROVADOR');
const canApproveLevel=n=>me?.papeis?.some(x=>x.papel==='APROVADOR'&&Number(x.nivel)===Number(n));
const head=(title,sub,actions='')=>`<header class="page-head"><div><p class="eyebrow">CAMPINAS · SUPRIMENTOS</p><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="head-actions">${actions}</div></header>`;
const card=x=>`<section class="card sup-buy-card">${x}</section>`;
const btn=(label,id,kind='')=>`<button class="btn ${kind}" data-do="${id}">${label}</button>`;
const link=(p,id)=>ROOT+p+'/?id='+encodeURIComponent(id);
const revealActiveTab=()=>requestAnimationFrame(()=>app.querySelector('.tabs .tab.active')?.scrollIntoView({block:'nearest',inline:'center'}));
const quoteOrders=q=>q.pedidos?.length
  ? `<div class="actions">${q.pedidos.map(o=>`<a class="btn" href="${link('cotacoes',o.id)}&tab=pedido">${esc(o.numero)} · ${esc(o.status)}</a>`).join('')}</div>`
  : has('COMPRADOR')?btn('Gerar pedidos','generate','primary'):'';
const supplierOptions=list=>list.map(s=>`<option value="${s.id}">${esc(s.razao)} · ${esc(s.situacao)}</option>`).join('');
const empty=(title)=>`<div class="empty-state"><strong>${esc(title)}</strong></div>`;
function error(e){app.innerHTML=`<div class="error-state"><strong>Não foi possível carregar.</strong><span>${esc(e.message)}</span><button class="btn" onclick="location.reload()">Tentar novamente</button></div>`}
async function act(fn){try{await fn()}catch(e){notice(e.message)}}

async function suppliersList(){
  const p=new URLSearchParams({size:'100'});
  for(const [name,id] of [['q','sup-q'],['situacao','sup-status'],['categoria','sup-cat'],['iqf_min','sup-iqf']]){const v=document.getElementById(id)?.value;if(v)p.set(name,v)}
  if(document.getElementById('sup-expiring')?.checked)p.set('documento_vencendo','true');
  const data=await api('/compras/fornecedores?'+p);
  app.innerHTML=head('Fornecedores','Qualificação, documentos, desempenho e compras.',
    has('COMPRADOR')?btn('Novo fornecedor','new-supplier','primary'):'')+
    card(`<div class="toolbar sup-buy-filters"><label class="field"><span>Buscar</span><input id="sup-q" placeholder="Razão, fantasia ou CNPJ" value="${esc(p.get('q')||'')}"></label>
    <label class="field"><span>Situação</span><select id="sup-status"><option value="">Todas</option>${['EM_QUALIFICACAO','HOMOLOGADO','HOMOLOGADO_CONDICIONAL','REPROVADO','SUSPENSO','BLOQUEADO'].map(x=>`<option value="${x}" ${p.get('situacao')===x?'selected':''}>${x.replaceAll('_',' ')}</option>`).join('')}</select></label>
    <label class="field"><span>Categoria</span><input id="sup-cat" value="${esc(p.get('categoria')||'')}" placeholder="Ex.: EPI"></label>
    <label class="field"><span>IQF mínimo</span><input id="sup-iqf" type="number" min="0" max="100" value="${esc(p.get('iqf_min')||'')}" placeholder="Ex.: 70"></label>
    <label class="sup-inline"><input id="sup-expiring" type="checkbox" ${p.has('documento_vencendo')?'checked':''}> Documento vencendo em 30 dias</label>
    ${btn('Filtrar','filter')}</div>
    <div class="table-scroll"><table><thead><tr><th>Razão / fantasia</th><th>CNPJ</th><th>Categorias</th><th>Situação</th><th>IQF / tendência</th><th>Homologação</th><th>Última compra</th></tr></thead><tbody>
    ${data.items.map(s=>`<tr><td><a class="link-row" href="${link('fornecedores',s.id)}">${esc(s.razao)}</a><small class="cell-muted">${esc(s.fantasia||'')}</small></td><td>${esc(s.cnpj)}</td><td>${esc((s.categorias||[]).join(', '))}</td><td>${badge(s.situacao)}</td><td>${s.iqf??'—'} ${esc(s.tendencia||'')}</td><td>${date(s.homologado_ate)}</td><td>${date(s.ultima_compra)}</td></tr>`).join('')}</tbody></table></div>${data.total?'':empty('Nenhum fornecedor encontrado')}`);
  app.querySelector('[data-do="filter"]').onclick=()=>act(suppliersList);
  app.querySelector('[data-do="new-supplier"]')?.addEventListener('click',()=>supplierForm());
}
function supplierForm(){
  app.innerHTML=`<a class="btn quiet" href="${ROOT}fornecedores/">← Fornecedores</a>`+head('Novo fornecedor','Dados cadastrais e categorias para iniciar a qualificação.')+
  card(`<form id="sup-form" class="sup-buy-form">
  ${field('cnpj','CNPJ',true)}${field('razao','Razão social',true)}${field('fantasia','Nome fantasia')}
  ${field('categorias','Categorias, separadas por vírgula',true)}${field('ie','Inscrição estadual')}
  ${field('email_pedido','E-mail para o pedido')}${field('condicao_pagamento','Pagamento')}
  ${field('prazo_padrao_dias','Prazo padrão, dias','', 'number')}
  <label class="field"><span>Frete padrão</span><select name="frete_padrao"><option>CIF</option><option>FOB</option></select></label>
  ${field('transportadora','Transportadora')}${field('observacoes','Observações')}
  ${field('logradouro','Rua e número')}${field('cidade','Cidade')}${field('uf','UF')}
  ${field('contato_comercial','Contato comercial')}${field('contato_financeiro','Contato financeiro')}${field('contato_qualidade','Contato qualidade')}
  <div class="sup-span">${btn('Salvar fornecedor','save-supplier','primary')}</div></form>`);
  document.getElementById('sup-form').onsubmit=e=>{e.preventDefault();act(async()=>{
    const f=new FormData(e.target), body=Object.fromEntries(f);body.categorias=body.categorias.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
    body.endereco={logradouro:body.logradouro,cidade:body.cidade,uf:body.uf};
    body.contatos={comercial:body.contato_comercial,financeiro:body.contato_financeiro,qualidade:body.contato_qualidade};
    for(const key of ['logradouro','cidade','uf','contato_comercial','contato_financeiro','contato_qualidade'])delete body[key];
    if(!body.prazo_padrao_dias)delete body.prazo_padrao_dias;
    const x=await send('/compras/fornecedores',body);location.assign(link('fornecedores',x.id));
  })};
}
function field(name,label,required=false,type='text',value=''){return `<label class="field"><span>${label}</span><input name="${name}" type="${type}" ${required?'required':''} value="${esc(value)}"></label>`}
function iqfChart(records){
  const values=[...records].reverse().slice(-12).map(x=>Number(x.iqf));
  if(!values.length)return empty('Ainda não há dados para a evolução do IQF');
  const points=values.map((v,i)=>`${30+(i*700/Math.max(1,values.length-1))},${150-v*1.25}`).join(' ');
  return `<div class="sup-iqf-chart" role="img" aria-label="Evolução do IQF: ${values.map(x=>x.toFixed(0)).join(', ')}"><svg viewBox="0 0 760 175" preserveAspectRatio="none" aria-hidden="true"><line x1="30" y1="25" x2="730" y2="25"/><line x1="30" y1="62" x2="730" y2="62"/><line x1="30" y1="100" x2="730" y2="100"/><line x1="30" y1="150" x2="730" y2="150"/><polyline points="${points}"/></svg><div class="sup-chart-labels"><span>100</span><span>70</span><span>40</span><span>0</span></div></div>`;
}
let supplierTab='cadastro';
async function supplierDetail(id){
  const s=await api('/compras/fornecedores/'+encodeURIComponent(id));
  const tabs=[['cadastro','Cadastro'],['documentos','Documentos'],['homologacao','Homologação'],['avaliacao','IQF'],['compras','Compras']];
  app.innerHTML=`<a class="btn quiet" href="${ROOT}fornecedores/">← Fornecedores</a>`+
    head(s.razao,s.cnpj+' · '+(s.fantasia||'Sem fantasia'),badge(s.situacao))+
    card(`<div class="tabs" role="tablist">${tabs.map(([id,label])=>`<button class="tab ${supplierTab===id?'active':''}" data-tab="${id}">${label}</button>`).join('')}</div><div id="supplier-tab"></div>`);
  revealActiveTab();
  app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{supplierTab=b.dataset.tab;supplierDetail(id)});
  const target=document.querySelector('#supplier-tab');
  if(supplierTab==='cadastro'){
    target.innerHTML=`<div class="sup-detail-grid">${[['Razão social',s.razao],['CNPJ',s.cnpj],['Nome fantasia',s.fantasia],['IE',s.ie],['Categorias',(s.categorias||[]).join(', ')],['E-mail do pedido',s.email_pedido],['Pagamento',s.condicao_pagamento],['Prazo padrão',s.prazo_padrao_dias&&s.prazo_padrao_dias+' dias'],['Frete',s.frete_padrao],['Transportadora',s.transportadora],['Endereço',address(s.endereco)],['Contatos',contacts(s.contatos)]].map(([a,b])=>`<div><small>${a}</small><strong>${esc(b||'—')}</strong></div>`).join('')}</div><p class="note">${esc(s.observacoes||'')}</p>${has('COMPRADOR')?btn('Editar ficha','edit','primary'):''}`;
    target.querySelector('[data-do="edit"]')?.addEventListener('click',()=>{target.innerHTML=`<form id="sup-edit" class="sup-buy-form">${['fantasia','ie','email_pedido','condicao_pagamento','transportadora','observacoes'].map(n=>field(n,n.replaceAll('_',' '),false,'text',s[n]||'')).join('')}${field('prazo_padrao_dias','Prazo, dias',false,'number',s.prazo_padrao_dias||'')}<label class="field"><span>Frete</span><select name="frete_padrao"><option ${s.frete_padrao==='CIF'?'selected':''}>CIF</option><option ${s.frete_padrao==='FOB'?'selected':''}>FOB</option></select></label><div class="sup-span">${btn('Salvar','save','primary')}</div></form>`;target.querySelector('form').onsubmit=e=>{e.preventDefault();act(async()=>{const body=Object.fromEntries(new FormData(e.target));body.prazo_padrao_dias=body.prazo_padrao_dias?Number(body.prazo_padrao_dias):null;await send('/compras/fornecedores/'+id,body,'PATCH');supplierDetail(id)})}});
    target.querySelector('[data-do="edit"]')?.addEventListener('click',()=>{
      const form=target.querySelector('#sup-edit');
      if(!form)return;
      form.querySelector('.sup-span').insertAdjacentHTML('beforebegin',
        `${field('logradouro','Rua e número',false,'text',s.endereco?.logradouro||'')}${field('cidade','Cidade',false,'text',s.endereco?.cidade||'')}${field('uf','UF',false,'text',s.endereco?.uf||'')}${field('contato_comercial','Contato comercial',false,'text',s.contatos?.comercial||'')}${field('contato_financeiro','Contato financeiro',false,'text',s.contatos?.financeiro||'')}${field('contato_qualidade','Contato qualidade',false,'text',s.contatos?.qualidade||'')}`);
      form.onsubmit=e=>{e.preventDefault();act(async()=>{const body=Object.fromEntries(new FormData(e.target));body.prazo_padrao_dias=body.prazo_padrao_dias?Number(body.prazo_padrao_dias):null;body.endereco={logradouro:body.logradouro,cidade:body.cidade,uf:body.uf};body.contatos={comercial:body.contato_comercial,financeiro:body.contato_financeiro,qualidade:body.contato_qualidade};for(const key of ['logradouro','cidade','uf','contato_comercial','contato_financeiro','contato_qualidade'])delete body[key];await send('/compras/fornecedores/'+id,body,'PATCH');supplierDetail(id)})};
    });
  }else if(supplierTab==='documentos'){
    target.innerHTML=`<div class="section-head"><h2>Documentos privados</h2></div><div class="table-scroll"><table><thead><tr><th>Tipo</th><th>Arquivo</th><th>Validade</th><th>Alerta</th></tr></thead><tbody>${s.documentos.map(d=>`<tr><td>${esc(d.tipo)}</td><td><a href="${API}/compras/fornecedores/${id}/documentos/${d.id}" target="_blank" rel="noopener">${esc(d.nome_original)}</a></td><td>${date(d.validade)}</td><td>${d.validade&&d.validade<new Date().toISOString().slice(0,10)?badge('VENCIDO'):d.validade&&d.validade<new Date(Date.now()+30*864e5).toISOString().slice(0,10)?badge('VENCE EM 30 DIAS'):'—'}</td></tr>`).join('')}</tbody></table></div>${has('COMPRADOR')? `<form id="sup-doc" class="sup-buy-form sup-top"><label class="field"><span>Tipo</span><select name="tipo">${['CARTAO_CNPJ','CONTRATO_SOCIAL','CERTIDAO','ISO','FDS','CA','LICENCA_AMBIENTAL','TITULO_ANM','LAUDO','OUTRO'].map(x=>`<option>${x}</option>`).join('')}</select></label>${field('validade','Validade',false,'date')}<label class="field"><span>Arquivo PDF, JPG ou PNG</span><input name="arquivo" type="file" accept=".pdf,.jpg,.jpeg,.png" required></label><div class="sup-span">${btn('Anexar documento','upload','primary')}</div></form>`:''}`;
    target.querySelector('#sup-doc')?.addEventListener('submit',e=>{e.preventDefault();act(async()=>{await api('/compras/fornecedores/'+id+'/documentos',{method:'POST',body:new FormData(e.target)});supplierDetail(id)})});
  }else if(supplierTab==='homologacao'){
    const criteria=await api('/compras/criterios');
    target.innerHTML=`<div class="sup-detail-grid"><div><small>Situação</small><strong>${badge(s.situacao)}</strong></div><div><small>Válida até</small><strong>${date(s.homologado_ate)}</strong></div><div><small>Pendências</small><strong>${esc(s.pendencias||'—')}</strong></div></div>
      <h2 class="sup-top">Histórico de decisões</h2><div class="sup-history">${s.homologacoes.map(h=>`<p>${badge(h.para)} · ${date(h.criado_em)} · ${esc(h.por_nome)}<br>${esc(h.parecer)}</p>`).join('')||'Nenhuma decisão registrada.'}</div>
      <h2 class="sup-top">Critérios por categoria</h2><div class="sup-history">${(s.categorias||[]).map(c=>{const row=criteria.find(x=>x.categoria===c);return `<p><strong>${esc(c)}</strong> · documentos: ${esc((row?.documentos||[]).join(', ')||'a definir')} · amostra: ${row?.exige_amostra?'obrigatória':'não obrigatória'}</p>`}).join('')}</div>
      ${has('QUALIDADE')?`<form id="sup-hom" class="sup-buy-form sup-top"><label class="field"><span>Decisão da Qualidade</span><select name="situacao">${['HOMOLOGADO','HOMOLOGADO_CONDICIONAL','REPROVADO','SUSPENSO','BLOQUEADO'].map(x=>`<option>${x}</option>`).join('')}</select></label>${field('condicional_ate','Prazo condicional',false,'date')}${field('pendencias','Pendências')}${field('documentos_pendentes','Códigos dos documentos pendentes, separados por vírgula')}${field('parecer','Parecer obrigatório',true)}<div class="sup-span">${btn('Registrar decisão','homologar','primary')}</div></form><form id="sup-criterion" class="sup-buy-form sup-top"><label class="field"><span>Categoria</span><select name="categoria">${(s.categorias||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select></label>${field('documentos','Documentos exigidos, separados por vírgula')}<label class="sup-inline"><input type="checkbox" name="exige_amostra"> Exigir amostra/ensaio</label><div class="sup-span">${btn('Salvar critérios','criterion')}</div></form>`:''}`;
    target.querySelector('#sup-hom')?.addEventListener('submit',e=>{e.preventDefault();act(async()=>{const body=Object.fromEntries(new FormData(e.target));body.checklist={pendentes:String(body.documentos_pendentes||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean)};delete body.documentos_pendentes;await send('/compras/fornecedores/'+id+'/homologar',body);supplierDetail(id)})});
    target.querySelector('#sup-criterion')?.addEventListener('submit',e=>{e.preventDefault();act(async()=>{const f=new FormData(e.target),cat=f.get('categoria');await send('/compras/criterios/'+encodeURIComponent(cat),{documentos:String(f.get('documentos')||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean),exige_amostra:f.has('exige_amostra')},'PUT');supplierDetail(id)})});
  }else if(supplierTab==='avaliacao'){
    target.innerHTML=`<div class="sup-detail-grid"><div><small>IQF · últimos 12 meses</small><strong class="sup-big">${s.iqf??'—'}</strong></div><div><small>Tendência</small><strong>${esc(s.tendencia||'—')}</strong></div><div><small>Faixa</small><strong>${esc(s.faixa||'\u2014')}</strong></div></div>${iqfChart(s.avaliacoes)}
      <div class="sup-history sup-top">${s.avaliacoes.map(a=>`<p>${date(a.avaliado_em)} · IQF ${esc(a.iqf)} · ${esc(a.comentario||'Sem comentário')}</p>`).join('')||'Sem avaliações.'}</div>
      ${has('ALMOXARIFE')||has('COMPRADOR')||has('QUALIDADE')?`<form id="sup-iqf" class="sup-buy-form sup-top">${['prazo','quantidade','qualidade','documentacao','atendimento'].map(x=>field(x,x+' · nota de 1 a 5',true,'number')).join('')}${field('pedido_id','ID do pedido, se houver')}${field('comentario','Comentário')}<div class="sup-span">${btn('Registrar avaliação','rate','primary')}</div></form>`:''}`;
    target.querySelector('#sup-iqf')?.addEventListener('submit',e=>{e.preventDefault();act(async()=>{const v=Object.fromEntries(new FormData(e.target));if(!v.pedido_id)delete v.pedido_id;await send('/compras/fornecedores/'+id+'/avaliacoes',v);supplierDetail(id)})});
  }else{
    target.innerHTML=`<div class="table-scroll"><table><thead><tr><th>Pedido</th><th>Situação</th><th>Valor</th><th>Entrega prevista</th></tr></thead><tbody>${s.pedidos.map(p=>`<tr><td><a href="${link('cotacoes',p.id)}&tab=pedido">${esc(p.numero)}</a></td><td>${badge(p.status)}</td><td>${brl(p.valor_total)}</td><td>${date(p.entrega_prevista)}</td></tr>`).join('')}</tbody></table></div>`;
  }
}

async function purchases(){
  const id=query.get('id');
  if(id&&query.get('tab')==='pedido')return orderDetail(id);
  if(id)return quoteDetail(id);
  const tabs=[['fila','Fila para compra'],['cotacoes','Cotações'],['pedidos','Pedidos']]
    .filter(([id])=>id==='fila'?has('COMPRADOR'):id==='cotacoes'?has('COMPRADOR')||has('QUALIDADE')||canApprove():has('COMPRADOR')||has('ALMOXARIFE')||has('QUALIDADE'));
  app.innerHTML=head('Cotações e pedidos','Da solicitação aprovada à entrega direta.')+
    `<nav class="tabs" aria-label="Compras">${tabs.map(([id,label])=>`<button class="tab ${viewTab===id?'active':''}" data-tab="${id}">${label}</button>`).join('')}</nav><div id="buy-content"></div>`;
  revealActiveTab();
  app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{viewTab=b.dataset.tab;purchases()});
  const target=document.querySelector('#buy-content');
  if(viewTab==='fila'){
    const data=await api('/compras/fila');
    target.innerHTML=card(`<div class="section-head"><h2>Itens aprovados para compra</h2>${has('COMPRADOR')?btn('Criar cotação com selecionados','create-quote','primary'):''}</div><div class="table-scroll"><table><thead><tr><th></th><th>Solicitação</th><th>Item</th><th>Quantidade</th><th>Categoria</th><th>CC</th></tr></thead><tbody>${data.items.map(x=>`<tr><td><input type="checkbox" value="${x.id}" aria-label="Selecionar ${esc(x.descricao_livre||x.descricao||'item')}"></td><td>${esc(x.numero)}</td><td>${esc(x.descricao_livre||x.descricao||x.material_id)}</td><td>${esc(x.qtd)}</td><td>${esc(x.categoria||'—')}</td><td>${esc(x.cc_id)}</td></tr>`).join('')}</tbody></table></div>${data.items.length?'':empty('Nenhum item na fila')}`);
    target.querySelector('[data-do="create-quote"]')?.addEventListener('click',()=>act(async()=>{const ids=[...target.querySelectorAll('input:checked')].map(x=>x.value);if(!ids.length)throw Error('Selecione pelo menos um item.');const q=await send('/compras/cotacoes',{itens:ids});location.assign(link('cotacoes',q.id))}));
  }else if(viewTab==='cotacoes'){
    const data=await api('/compras/cotacoes?size=100');
    target.innerHTML=card(`<h2>Cotações</h2><div class="table-scroll"><table><thead><tr><th>Número</th><th>Situação</th><th>Justificativa</th><th>Aberta em</th></tr></thead><tbody>${data.items.map(x=>`<tr><td><a href="${link('cotacoes',x.id)}">${esc(x.numero)}</a></td><td>${badge(x.status)}</td><td>${esc(x.fechamento_justificativa||'—')}</td><td>${date(x.criado_em)}</td></tr>`).join('')}</tbody></table></div>${data.items.length?'':empty('Nenhuma cotação')}`);
  }else{
    const data=await api('/compras/pedidos?size=100');
    target.innerHTML=card(`<h2>Pedidos de compra</h2><div class="table-scroll"><table><thead><tr><th>Número</th><th>Situação</th><th>Valor</th><th>Entrega prevista</th><th>Em atraso</th></tr></thead><tbody>${data.items.map(x=>`<tr><td><a href="${link('cotacoes',x.id)}&tab=pedido">${esc(x.numero)}</a></td><td>${badge(x.status)}</td><td>${brl(x.valor_total)}</td><td>${date(x.entrega_prevista)}</td><td>${x.entrega_prevista<new Date().toISOString().slice(0,10)&&!['RECEBIDO','ENCERRADO'].includes(x.status)?badge('ATRASADO'):'—'}</td></tr>`).join('')}</tbody></table></div>${data.items.length?'':empty('Nenhum pedido')}`);
  }
}
async function quoteDetail(id){
  quote=await api('/compras/cotacoes/'+id);
  suppliers=has('COMPRADOR')||has('QUALIDADE')?(await api('/compras/fornecedores?size=100')).items:[];
  const approved=suppliers.filter(s=>['HOMOLOGADO','HOMOLOGADO_CONDICIONAL'].includes(s.situacao));
  const categories=[...new Set(quote.itens.map(x=>x.categoria).filter(Boolean))];
  const eligible=suppliers.filter(s=>categories.every(category=>(s.categorias||[]).includes(category)))
    .sort((a,b)=>Number(approved.includes(b))-Number(approved.includes(a)));
  app.innerHTML=`<a class="btn quiet" href="${ROOT}cotacoes/?tab=cotacoes">← Cotações</a>`+head('Cotação '+quote.numero,'Mapa comparativo por item e fornecedor.',badge(quote.status))+
    card(`<div class="section-head"><h2>Mapa comparativo</h2><span class="note">Custo posto = itens + IPI + ICMS-ST − desconto + frete FOB</span></div><div class="table-scroll"><table class="sup-matrix"><thead><tr><th>Item / quantidade</th>${quote.fornecedores.map(s=>`<th>${esc(s.razao)}<small>${badge(s.situacao)} · IQF ${s.iqf??'—'}</small></th>`).join('')}</tr></thead><tbody>${quote.itens.map(item=>`<tr><td><strong>${esc(item.descricao_livre||item.material_id)}</strong><small>${esc(item.solicitacao_numero)} · ${esc(item.qtd)} unidades</small></td>${quote.fornecedores.map(s=>{const x=quote.propostas.find(p=>p.cotacao_item_id===item.id&&p.fornecedor_unidade_id===s.fornecedor_unidade_id),all=quote.propostas.filter(p=>p.cotacao_item_id===item.id),low=Math.min(...all.map(p=>Number(p.custo_posto)));return `<td>${x?`<strong class="${Number(x.custo_posto)===low?'sup-low':''}">${brl(x.custo_posto)}</strong><small>Unitário ${brl(x.preco_unit)} · ${x.prazo_dias} dias · ${x.frete_tipo}</small>${x.escolhido?badge('ESCOLHIDO'):quote.status!=='FECHADA'&&has('COMPRADOR')?btn('Escolher','choose:'+x.id):''}`:'Sem proposta'}</td>`}).join('')}</tr>`).join('')}</tbody><tfoot><tr><th>Total por fornecedor</th>${quote.fornecedores.map(s=>`<th>${brl(quote.propostas.filter(p=>p.fornecedor_unidade_id===s.fornecedor_unidade_id).reduce((a,p)=>a+Number(p.custo_posto),0))}</th>`).join('')}</tr></tfoot></table></div>`)+
    (quote.status==='FECHADA'?card(`<h2>Pedido de compra</h2>${quoteOrders(quote)}`):card(`<h2>Registrar proposta</h2>${has('COMPRADOR')?`<div class="sup-buy-form"><label class="field"><span>Situa??o</span><select id="invite-status"><option value="">Todas</option>${["HOMOLOGADO","HOMOLOGADO_CONDICIONAL","EM_QUALIFICACAO","REPROVADO","SUSPENSO","BLOQUEADO"].map(x=>`<option value="${x}">${esc(x.replaceAll("_"," "))}</option>`).join("")}</select></label><label class="field"><span>Fornecedor</span><select id="invite-supplier">${supplierOptions(eligible)}</select></label>${eligible.length?btn('Convidar','invite'):'<span class="note">Nenhum fornecedor atende todas as categorias.</span>'}</div><form id="offer-form" class="sup-buy-form sup-top"><label class="field"><span>Item</span><select name="item_id">${quote.itens.map(x=>`<option value="${x.id}">${esc(x.descricao_livre||x.material_id)}</option>`).join('')}</select></label><label class="field"><span>Fornecedor convidado</span><select name="fornecedor_id">${quote.fornecedores.map(x=>`<option value="${x.fornecedor_unidade_id}">${esc(x.razao)}</option>`).join('')}</select></label>${field('preco_unit','Preço unitário',true,'number')}${field('ipi','IPI',false,'number')}${field('icms_st','ICMS-ST',false,'number')}${field('desconto','Desconto',false,'number')}<label class="field"><span>Frete</span><select name="frete_tipo"><option>CIF</option><option>FOB</option></select></label>${field('frete_valor','Frete (R$)',false,'number')}<label class="field"><span>Rateio</span><select name="frete_rateio"><option>TOTAL</option><option>UNIDADE</option></select></label>${field('prazo_dias','Prazo em dias',true,'number')}${field('validade','Validade',true,'date')}${field('pagamento','Pagamento')}${field('transportadora','Transportadora')}<div class="sup-span">${btn('Registrar proposta','offer','primary')}</div></form><div class="sup-top">${btn('Fechar cotação','close','primary')}</div>`:''}${has('QUALIDADE')?`<form id="emergency-form" class="sup-buy-form sup-top"><label class="field"><span>Fornecedor sem homologação</span><select name="fornecedor_id">${suppliers.filter(s=>!approved.some(a=>a.id===s.id)).map(s=>`<option value="${s.id}">${esc(s.razao)}</option>`).join('')}</select></label>${field('parecer','Parecer da Qualidade (mín. 20 caracteres)',true)}<div class="sup-span">${btn('Autorizar exceção emergencial','emergency')}</div></form>`:''}`));
  if(quote.status==='PENDENTE_APROVACAO'){
    app.querySelector('.sup-buy-card:last-child').innerHTML=`<h2>Aguardando aprovação do fechamento</h2><p>Esta cotação tem menos de três propostas e precisa de autorização da alçada · nível ${Number(quote.aprovacoes_feitas)+1} de ${quote.niveis_exigidos}.</p><p><strong>Justificativa:</strong> ${esc(quote.fechamento_justificativa)}</p>${canApproveLevel(Number(quote.aprovacoes_feitas)+1)?btn('Aprovar fechamento','approve-close','primary'):''}`;
  }
  const attached=quote.propostas.filter(p=>p.tem_anexo);
  if(attached.length){app.insertAdjacentHTML('beforeend',card(`<h2>Anexos das propostas</h2><div class="actions">${attached.map(p=>`<a class="btn" href="${API}/compras/cotacoes/${id}/propostas/${p.id}/anexo" target="_blank" rel="noopener">Proposta ${esc(p.id.slice(0,8))}</a>`).join('')}</div>`))}
  const offerForm=app.querySelector('#offer-form');
  offerForm?.querySelector('.sup-span')?.insertAdjacentHTML('beforebegin','<label class="field"><span>Anexo da proposta · PDF, JPG ou PNG</span><input name="anexo" type="file" accept=".pdf,.jpg,.jpeg,.png"></label>');
  app.querySelector('[data-do="approve-close"]')?.addEventListener('click',()=>act(async()=>{await send('/compras/cotacoes/'+id+'/aprovar-fechamento',{});quoteDetail(id)}));
  app.querySelectorAll('[data-do^="choose:"]').forEach(b=>b.onclick=()=>act(async()=>{const justification=await supAsk('Escolher proposta',{label:'Justificativa se não for o menor custo',required:false,multiline:true});if(justification===null)return;await send('/compras/cotacoes/'+id+'/escolher',{proposta_id:b.dataset.do.split(':')[1],justificativa});quoteDetail(id)}));
  app.querySelector('[data-do="invite"]')?.addEventListener('click',()=>act(async()=>{await send('/compras/cotacoes/'+id+'/convidar',{fornecedor_id:document.getElementById('invite-supplier').value});quoteDetail(id)}));
  app.querySelector('#invite-status')?.addEventListener('change',event=>{
    const available=eligible.filter(s=>!event.target.value||s.situacao===event.target.value);
    app.querySelector('#invite-supplier').innerHTML=supplierOptions(available);
    app.querySelector('[data-do="invite"]').disabled=!available.length;
  });
  offerForm?.addEventListener('submit',e=>{e.preventDefault();act(async()=>{const form=new FormData(e.target),file=form.get('anexo');form.delete('anexo');const saved=await send('/compras/cotacoes/'+id+'/propostas',Object.fromEntries(form));if(file?.size){const upload=new FormData();upload.set('arquivo',file);await api('/compras/cotacoes/'+id+'/propostas/'+saved.id+'/anexo',{method:'POST',body:upload})}quoteDetail(id)})});
  app.querySelector('#emergency-form')?.addEventListener('submit',e=>{e.preventDefault();act(async()=>{await send('/compras/cotacoes/'+id+'/excecao-fornecedor',Object.fromEntries(new FormData(e.target)));quoteDetail(id)})});
  app.querySelector('[data-do="close"]')?.addEventListener('click',()=>act(async()=>{const justificativa=await supAsk('Fechar cotação',{label:'Justificativa se houver menos de 3 propostas',required:false,multiline:true});if(justificativa===null)return;await send('/compras/cotacoes/'+id+'/fechar',{justificativa});quoteDetail(id)}));
  app.querySelector('[data-do="generate"]')?.addEventListener('click',()=>act(async()=>{const x=await send('/compras/cotacoes/'+id+'/gerar-pedidos',{});notice(x.pedidos.map(p=>p.numero).join(', ')+' criado(s).');location.assign(link('cotacoes',x.pedidos[0].id)+'&tab=pedido')}));
}
async function orderDetail(id){
  order=await api('/compras/pedidos/'+id);
  app.innerHTML=`<a class="btn quiet" href="${ROOT}cotacoes/?tab=pedidos">← Pedidos</a>`+
    head('Pedido '+order.numero,order.fornecedor.razao+' · entrega prevista '+date(order.entrega_prevista),badge(order.status))+
    card(`<div class="sup-detail-grid"><div><small>Valor total</small><strong class="sup-big">${brl(order.valor_total)}</strong></div><div><small>Situação</small><strong>${badge(order.status)}</strong></div><div><small>NF</small><strong>${esc(order.nf_numero||'Pendente')}</strong></div></div>
    <div class="table-scroll sup-top"><table><thead><tr><th>Solicitação</th><th>Item</th><th>Quantidade</th><th>Recebida</th><th>Custo posto</th></tr></thead><tbody>${order.itens.map(i=>`<tr><td>${esc(i.solicitacao_numero)}</td><td>${esc(i.descricao_livre||i.material_id)}</td><td>${esc(i.qtd)}</td><td>${esc(i.qtd_recebida)}</td><td>${brl(i.custo_posto)}</td></tr>`).join('')}</tbody></table></div><div class="actions sup-top">
    ${order.status==='REAPROVACAO'&&canApprove()?btn('Aprovar nova alçada','approve','primary'):''}
    ${order.status==='RASCUNHO'&&has('COMPRADOR')?btn('Emitir','emit','primary'):''}
    ${['EMITIDO','ENVIADO','PARCIAL','RECEBIDO','ENCERRADO'].includes(order.status)?btn('Baixar PDF','pdf'):''}
    ${order.status==='EMITIDO'&&has('COMPRADOR')?btn('Marcar enviado','send','primary'):''}
    ${['ENVIADO','PARCIAL'].includes(order.status)&&has('COMPRADOR')?btn('Registrar follow-up','follow'):''}
    ${['ENVIADO','PARCIAL'].includes(order.status)&&has('ALMOXARIFE')?btn('Receber quantidade','receive','primary'):''}
    ${order.status==='RECEBIDO'&&has('COMPRADOR')?btn('Encerrar','finish','primary'):''}
    ${['RASCUNHO','EMITIDO','ENVIADO'].includes(order.status)&&has('COMPRADOR')?btn('Cancelar','cancel','danger'):''}
    </div>`)+card(`<h2>Histórico</h2><div class="sup-history">${order.eventos.map(e=>`<p>${dateTime(e.em)} · ${esc(e.de||'Início')} → ${esc(e.para)} · ${esc(e.comentario||'')}</p>`).join('')}</div>`);
  const doAction=async(kind)=>{
    if(kind==='pdf'){const b=await api('/compras/pedidos/'+id+'/pdf');const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=order.numero+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);return}
    const path={approve:'aprovar',emit:'emitir',send:'enviar',follow:'follow-up',receive:'receber',finish:'encerrar',cancel:'cancelar'}[kind];
    let body={};
    if(kind==='receive'){
      const form=await supDialog({title:'Receber pedido',content:`<label class="sup-dialog-field"><span>Item do pedido</span><select name="item_id" required>${order.itens.map(item=>`<option value="${esc(item.id)}">${esc(item.descricao_livre||item.material_id)}</option>`).join('')}</select></label><label class="sup-dialog-field"><span>Quantidade recebida</span><input name="qtd" type="number" min="0.0001" step="0.0001" required></label><label class="sup-dialog-field"><span>Número da NF</span><input name="numero_nf" required></label>`});
      if(!form)return;body=Object.fromEntries(form);
    }
    if(['follow','cancel'].includes(kind)){body.comentario=await supAsk(kind==='cancel'?'Cancelar pedido':'Registrar acompanhamento',{label:'Comentário ou motivo',multiline:true});if(!body.comentario)return}
    await send('/compras/pedidos/'+id+'/'+path,body);orderDetail(id);
  };
  app.querySelectorAll('[data-do]').forEach(b=>b.onclick=()=>act(()=>doAction(b.dataset.do)));
}
async function init(){try{me=await api('/me');if(!me.flags?.S3A)throw Error('Compras ainda não está habilitado nesta unidade.');if(page==='fornecedores')return query.has('id')?supplierDetail(query.get('id')):suppliersList();if(!query.has('tab'))viewTab=has('COMPRADOR')?'fila':has('ALMOXARIFE')?'pedidos':'cotacoes';return purchases()}catch(e){error(e)}}
init();
