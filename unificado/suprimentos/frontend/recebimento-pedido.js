import {supDialog,supConfirm} from './dialog.js?v=1.4.3';
const app=document.querySelector('#app'),ROOT='/unificado/suprimentos/',API='/api/suprimentos';
const qs=new URLSearchParams(location.search);
let me,row,step=1,preview=null,found=[],addresses=[],busy=false;
let stopCamera=()=>{};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>x==null?'Cega':Number(x).toLocaleString('pt-BR',{maximumFractionDigits:4});
const role=r=>me?.papeis.some(x=>x.papel===r||x.papel==='ADMIN');
const card=s=>`<section class="card sup-r-card">${s}</section>`;
const button=(label,id,kind='')=>`<button type="button" class="btn ${kind}" data-do="${esc(id)}">${esc(label)}</button>`;
const field=(name,label,value='',type='text')=>`<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" value="${esc(value)}" type="${type}" ${type==='number'?'min="0" step="0.0001"':''}></label>`;
function toast(message){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),6000)}
async function api(path,opt={},retry=true){const r=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...opt,headers:opt.body&&!(opt.body instanceof FormData)?{'Content-Type':'application/json',...opt.headers}:opt.headers});if(r.status===401&&retry){const renewed=await fetch(ROOT+'session-renew',{credentials:'same-origin',cache:'no-store'});if(renewed.ok)return api(path,opt,false)}const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:`Não foi possível concluir (${r.status})`);return data}
const send=(path,data={},method='POST')=>api(path,{method,body:JSON.stringify(data)});
async function act(fn){if(busy)return;busy=true;app.inert=true;app.setAttribute('aria-busy','true');const buttons=[...app.querySelectorAll('button')];buttons.forEach(x=>x.disabled=true);try{await fn()}catch(e){toast(e.message)}finally{busy=false;app.inert=false;app.setAttribute('aria-busy','false');buttons.forEach(x=>x.disabled=false)}}
const head=(title,sub,actions='')=>`<header class="page-head"><div><p class="eyebrow">SUPRIMENTOS · RECEBIMENTO</p><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="head-actions">${actions}</div></header>`;
const addr=(name,value)=>`<label class="field"><span>Endereço de entrada</span><select name="${name}"><option value="">Selecione</option>${addresses.map(x=>`<option value="${x.id}" ${x.id===value?'selected':''}>${esc(x.codigo)}</option>`).join('')}</select></label>`;
const back=`<a class="btn quiet" href="${ROOT}recebimento/">← Recebimentos</a>`;
function bind(id,fn){app.querySelector(`[data-do="${id}"]`)?.addEventListener('click',()=>act(fn))}

async function list(){
 const data=await api('/recebimentos');
 app.innerHTML=head('Recebimento','Confira por pedido, acompanhe cada NF e evite recebimento duplicado.',role('ALMOXARIFE')?button('Receber pedido','new','primary'):'')+
 card(`<h2>Notas e conferências</h2><div class="table-scroll"><table><thead><tr><th>Nota fiscal</th><th>Pedido</th><th>Situação</th><th>Inspeção</th><th>Data</th></tr></thead><tbody>${data.items.map(x=>`<tr><td><a class="link-row" href="?${x.tipo==='SEM_PEDIDO'&&x.regularizacao_status!=='REGULARIZADO'?'excecao':'id'}=${x.id}">NF ${esc(x.numero_nf)}</a></td><td>${esc(x.pedido_numero)}</td><td>${esc(x.status.replaceAll('_',' '))}</td><td>${esc(x.inspecao_status||'Aguardando')}</td><td>${new Date(x.criado_em).toLocaleDateString('pt-BR')}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum recebimento.</td></tr>'}</tbody></table></div>`);
 bind('new',identify);await renderExtensions('list');
}

async function identify(){
 stopCamera();
 step=1;app.innerHTML=back+head('Identificar recebimento','1 de 5 · Pedido, chave NF-e ou fornecedor. O XML preenche os dados da nota.')+
 card(`<form id="search" class="sup-r-search">${field('busca','Pedido, NF ou fornecedor',qs.get('pedido')||'')}<button class="btn primary">Buscar</button>${button('Ler DANFE com a câmera','camera')}</form><div id="camera"></div><label class="field sup-r-upload"><span>XML da NF-e (preferencial, até 12 MB)</span><input id="xml" type="file" accept=".xml,application/xml,text/xml"></label><div id="search-result"></div>`);
 document.querySelector('#search').onsubmit=e=>{e.preventDefault();act(()=>search(new FormData(e.target).get('busca')))};
 bind('camera',scan);
 document.querySelector('#xml').onchange=e=>act(async()=>{const f=e.target.files[0];if(!f)return;const body=new FormData();body.append('arquivo',f);preview=await api('/recebimento-pedido/xml',{method:'POST',body});await search(preview.nf.chave_nf)});
 if(qs.get('pedido'))await search(qs.get('pedido'));
}

async function search(term){
 const data=await api('/recebimento-pedido/identificar?busca='+encodeURIComponent(term));found=data.items;
 const nf=preview?.nf||data.nf||{};
 document.querySelector('#search-result').innerHTML=`<form id="choose"><h2>${preview?'XML lido · '+esc(nf.emitente):'Pedidos com saldo disponível'}</h2><p>Selecione as OCs do mesmo fornecedor cobertas por esta NF.</p>${found.map(x=>`<label class="sup-r-order"><input type="checkbox" name="orders" value="${x.id}" ${nf.cnpj_nf===x.cnpj?'checked':''}><span><strong>${esc(x.numero)} · ${esc(x.razao)}</strong><small>${x.itens_pendentes} itens pendentes · previsão ${esc(x.entrega_prevista||'não informada')}</small></span></label>`).join('')||'<p>Nenhuma OC com saldo e acesso disponível para esta busca.</p>'}<div class="sup-rec-fields">${field('numero_nf','Número da NF',nf.numero_nf||'')}${field('chave_nf','Chave NF-e (opcional)',nf.chave_nf||'')}${field('frete_total','Frete da NF (R$)',nf.frete_total||0,'number')}</div>${found.length?'<button class="btn primary" type="submit">Iniciar conferência →</button>':''}</form>`;
 document.querySelector('#choose').onsubmit=e=>{e.preventDefault();act(async()=>{const form=new FormData(e.target);const data={pedido_ids:form.getAll('orders'),numero_nf:form.get('numero_nf'),chave_nf:form.get('chave_nf'),frete_total:form.get('frete_total'),previa_id:preview?.previa_id};row=await send('/recebimento-pedido/rascunhos',data);qs.set('id',row.id);history.replaceState(null,'','?id='+row.id);step=2;await render()})};
}

async function scan(){
 stopCamera();
 const node=document.querySelector('#camera');
 if(!('BarcodeDetector'in window)||!navigator.mediaDevices?.getUserMedia){toast('Este navegador não oferece leitor de barras. Digite a chave de 44 dígitos ou envie o XML.');return}
 const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
 node.innerHTML='<video autoplay playsinline class="sup-r-camera"></video><button type="button" class="btn">Fechar câmera</button>';
 const video=node.querySelector('video');video.srcObject=stream;
 let stopped=false;const stop=()=>{stopped=true;stream.getTracks().forEach(t=>t.stop());node.innerHTML=''};stopCamera=stop;
 node.querySelector('button').onclick=stop;window.addEventListener('pagehide',stop,{once:true});
 const detector=new BarcodeDetector({formats:['code_128']});
 async function tick(){if(stopped)return;try{const codes=await detector.detect(video);const code=codes.find(x=>/^\d{44}$/.test(x.rawValue));if(code){stop();document.querySelector('[name=busca]').value=code.rawValue;await search(code.rawValue);return}}catch(e){stop();toast('Não foi possível ler. Digite a chave ou envie o XML.');return}setTimeout(tick,350)}
 await video.play();tick();
}

async function reload(){row=await api('/recebimentos/'+row.id);await render()}
function navigation(){return `<nav class="sup-r-steps" aria-label="Etapas do recebimento">${['Identificar','Conferir','Destino','Inspeção','Confirmar'].map((s,i)=>`<button type="button" data-step="${i+1}" ${i+1===step?'aria-current="step"':''} ${i===0?'disabled':''}>${i+1}. ${s}</button>`).join('')}</nav>`}
async function render(){
 stopCamera();
 app.innerHTML=back+head('NF '+row.numero_nf,`${row.pedido_numero} · ${row.status.replaceAll('_',' ')} · versão ${row.versao}`)+navigation()+`<div id="receipt-content"></div>`;
 app.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>act(async()=>{step=Number(b.dataset.step);await render()}));
 if(step===2)await count();if(step===3)await destination();if(step===4)await inspection();if(step===5)await confirmation();
 await renderExtensions('detail');
}

function xmlAssociations(){
 const nf=row.extraido;if(!nf?.itens)return '';
 return card(`<details open><summary>Itens do XML · associação ao pedido</summary><p>Confirme cada associação. O de-para será reutilizado nas próximas NFs.</p>${nf.itens.map((x,i)=>`<form class="sup-r-associate" data-index="${i}"><strong>${esc(x.codigo_fornecedor)} · ${esc(x.descricao)}</strong><span>${esc(x.qtd_nf)} ${esc(x.un_fornecedor)}</span><label class="field"><span>Item da OC</span><select name="item_id"><option value="">Não pertence ao pedido</option>${row.itens.map(y=>`<option value="${y.id}" ${nf.associacoes?.[String(i)]?.item_id===y.id?'selected':''}>${esc(y.pedido_numero)} · ${esc(y.descricao)}</option>`).join('')}</select></label>${field('fator_conversao','Unidades de estoque por unidade NF',nf.associacoes?.[String(i)]?.fator_conversao||1,'number')}<button class="btn" ${row.status!=='RASCUNHO'?'disabled':''}>Confirmar associação</button><button class="btn" type="button" data-split="${i}">Dividir entre OCs</button></form>`).join('')}</details>`);
}

async function count(){
 const content=document.querySelector('#receipt-content');const editable=row.status==='RASCUNHO'&&role('ALMOXARIFE');
 content.innerHTML=xmlAssociations()+card(`<h2>Conferir quantidades e valores</h2><p>Conte na unidade de estoque. ${row.itens.some(x=>x.contagem_cega)?'Contagem cega: o esperado será revelado após salvar a contagem.':'O saldo está reservado para esta conferência.'}</p><form id="counts"><div class="table-scroll"><table class="sup-r-count"><thead><tr><th>Material / OC</th><th>Pedido</th><th>Já recebido</th><th>Pendente</th><th>Na NF</th><th>Contado</th><th>Preço OC</th><th>Preço NF</th><th>IPI</th><th>Situação</th></tr></thead><tbody>${row.itens.map(x=>`<tr data-line="${x.id}"><td><strong>${esc(x.descricao)}</strong><small>${esc(x.pedido_numero)} · ${esc(x.unidade_medida)}</small></td><td>${num(x.qtd_pedido)}</td><td>${num(x.qtd_recebida)}</td><td>${num(x.qtd_saldo_pedido)}</td><td>${x.contagem_cega?'Cega':`<input aria-label="Quantidade na NF de ${esc(x.descricao)}" name="qtd_nf" type="number" min="0" step="0.0001" value="${x.qtd_nf}" ${!editable?'disabled':''}>`}</td><td><input aria-label="Quantidade contada de ${esc(x.descricao)}" name="qtd_contada" type="number" min="0" step="0.0001" value="${x.contagem_registrada?x.qtd_contada:''}" ${!editable?'disabled':''} required></td><td>${num(x.preco_oc)}</td><td><input aria-label="Preço NF de ${esc(x.descricao)}" name="preco_nf" type="number" min="0" step="0.0001" value="${x.preco_nf}" ${!editable?'disabled':''}></td><td><input aria-label="IPI de ${esc(x.descricao)}" name="ipi_valor" type="number" min="0" step="0.01" value="${x.ipi_valor}" ${!editable?'disabled':''}></td><td>${Object.keys(x.divergencia||{}).map(k=>esc(k.replaceAll('_',' '))).join('<br>')||'A conferir'}</td></tr>`).join('')}</tbody></table></div>${editable?'<button class="btn primary" type="submit">Salvar contagens e revelar esperado</button>':''}</form>`)+
 card(`<h2>Documento fiscal</h2><p>O XML e a foto/PDF são privados e acessíveis somente a quem pode consultar este recebimento.</p>${row.xml_path?`<a class="btn" href="${API}/recebimento-pedido/${row.id}/xml" target="_blank" rel="noopener">Ver XML</a>`:''}${row.anexo_path?`<a class="btn" href="${API}/recebimentos/${row.id}/nf" target="_blank" rel="noopener">Ver NF</a>`:editable?'<input id="nf-photo" type="file" accept="application/pdf,image/jpeg,image/png" capture="environment">'+button('Anexar NF','attach'):''}`)+card(button('Próximo: destino →','next','primary'));
 document.querySelectorAll('.sup-r-associate').forEach(form=>form.onsubmit=e=>{e.preventDefault();act(async()=>{const f=new FormData(form);const iid=f.get('item_id');await send(`/recebimento-pedido/${row.id}/associar`,{indice:Number(form.dataset.index),item_id:iid,fora_pedido:!iid,fator_conversao:f.get('fator_conversao')});await reload()})});
 content.querySelectorAll('[data-split]').forEach(b=>b.onclick=()=>act(async()=>{const index=Number(b.dataset.split),raw=row.extraido.itens[index];const f=await supDialog({title:'Dividir linha XML entre pedidos',message:`Distribua ${raw.qtd_nf} ${raw.un_fornecedor}. As quantidades abaixo estão na unidade do fornecedor.`,content:field('fator','Fator de conversão',1,'number')+row.itens.map(x=>field(x.id,x.pedido_numero+' · '+x.descricao,0,'number')).join('')});if(!f)return;const partes=row.itens.map(x=>({item_id:x.id,qtd_nf:f.get(x.id)})).filter(x=>Number(x.qtd_nf)>0);await send(`/recebimento-pedido/${row.id}/associar`,{indice:index,partes,fator_conversao:f.get('fator')});await reload()}));
 document.querySelector('#counts').onsubmit=e=>{e.preventDefault();act(async()=>{for(const node of document.querySelectorAll('[data-line]')){const data={};node.querySelectorAll('input:not(:disabled)').forEach(x=>data[x.name]=x.value);await send(`/recebimentos/${row.id}/itens/${node.dataset.line}`,data,'PUT')}await reload();toast('Contagens salvas.')})};
 bind('attach',async()=>{const f=document.querySelector('#nf-photo').files[0];if(!f)throw Error('Selecione um arquivo.');const body=new FormData();body.append('arquivo',f);await api(`/recebimentos/${row.id}/nf`,{method:'POST',body});await reload()});
 bind('next',async()=>{if(row.itens.some(x=>!x.contagem_registrada))throw Error('Salve a contagem de todos os itens, inclusive zero.');step=3;await render()});
}

async function destination(){
 const suggested=(await api(`/recebimento-pedido/${row.id}/destinos`)).items;
 const content=document.querySelector('#receipt-content');const origins=row.origens||row.itens.map(x=>({id:x.solicitacao_item_id,numero:x.solicitacao_numero}));
 const alloc=(item,a={})=>`<div class="sup-r-allocation"><label class="field"><span>Destino</span><select name="source"><option value="">Estoque livre</option>${origins.filter(x=>x.id).map(x=>`<option value="${x.id}" ${String(a.solicitacao_item_id)===String(x.id)?'selected':''}>${esc(x.numero)} ${esc(x.urgencia||'')}</option>`).join('')}</select></label>${field('qtd','Quantidade',a.qtd||0,'number')}<button type="button" class="btn" data-remove>Remover</button></div>`;
 content.innerHTML=card(`<h2>Destino dos materiais</h2><p>A sugestão atende primeiro solicitações com produção parada, depois urgentes e as mais antigas. A sobra fica em estoque. Ajuste antes de confirmar.</p><form id="destinations">${row.itens.map(x=>`<section class="sup-rec-item" data-destination="${x.id}"><h3>${esc(x.descricao)} · ${num(x.qtd_contada)} ${esc(x.unidade_medida)}</h3>${addr('endereco_id',x.endereco_id)}<div class="allocations">${(x.alocacoes?.length?x.alocacoes:suggested[x.id]||[]).map(a=>alloc(x,a)).join('')}</div><button type="button" class="btn" data-add>Adicionar destino</button></section>`).join('')}<button type="submit" class="btn primary" ${row.status==='CONFIRMADO'||row.status==='ESTORNADO'?'disabled':''}>Salvar destinos e conferir NF →</button></form>`);
 content.querySelectorAll('[data-destination]').forEach(node=>{node.querySelector('[data-add]').onclick=()=>node.querySelector('.allocations').insertAdjacentHTML('beforeend',alloc());node.addEventListener('click',e=>{if(e.target.matches('[data-remove]'))e.target.closest('.sup-r-allocation').remove()})});
 document.querySelector('#destinations').onsubmit=e=>{e.preventDefault();act(async()=>{const items={};for(const node of document.querySelectorAll('[data-destination]')){const address=node.querySelector('[name=endereco_id]').value;const line=row.itens.find(x=>x.id===node.dataset.destination);if(row.status==='RASCUNHO')await send(`/recebimentos/${row.id}/itens/${line.id}`,{endereco_id:address},'PUT');items[line.id]=[...node.querySelectorAll('.sup-r-allocation')].map(a=>({solicitacao_item_id:a.querySelector('[name=source]').value||null,qtd:a.querySelector('[name=qtd]').value,endereco_id:address||null}))}await send(`/recebimento-pedido/${row.id}/destinos`,{items},'PUT');if(row.status==='RASCUNHO')await send(`/recebimentos/${row.id}/conferir`,{confirmo_campos_nf:true});step=4;await reload()})};
}

async function inspection(){
 const content=document.querySelector('#receipt-content');
 if(row.status==='PENDENTE_COMPRADOR'){
   content.innerHTML=card(`<h2>Divergências para Compras</h2><p>As quantidades foram conferidas. O comprador precisa decidir as divergências antes da inspeção.</p>${row.itens.map(x=>`<p><strong>${esc(x.descricao)}</strong>: ${Object.keys(x.divergencia||{}).map(k=>esc(k.replaceAll('_',' '))).join(', ')||'Sem divergência'}</p>`).join('')}${role('COMPRADOR')?button('Registrar decisão do comprador','resolve','primary'):''}`);
   bind('resolve',async()=>{const f=await supDialog({title:'Decisão sobre divergências',content:'<label class="field"><span>Justificativa da decisão</span><textarea name="justificativa" minlength="10" required></textarea></label>'});if(!f)return;await send(`/recebimentos/${row.id}/resolver`,Object.fromEntries(f));await reload()});return;
 }
 const editable=row.status==='EM_INSPECAO'&&role('QUALIDADE');
 content.innerHTML=card(`<h2>Inspeção dos materiais</h2><p>Critérios da categoria continuam obrigatórios. A decisão é registrada pela Qualidade.</p><form id="inspection">${row.itens.map(x=>`<section class="sup-rec-item" data-inspection="${x.id}"><h3>${esc(x.descricao)}</h3><div class="sup-rec-fields">${field('numero_ca','CA',x.numero_ca||'')}${field('lote','Lote',x.lote||'')}${field('validade','Validade',x.validade||'','date')}<label class="field"><span>FDS presente</span><input name="fds_presente" type="checkbox" ${x.fds_presente?'checked':''}></label><label class="field"><span>Embalagem íntegra</span><input name="embalagem_ok" type="checkbox" ${x.embalagem_ok?'checked':''}></label><label class="field"><span>Quantidade conforme</span><input name="quantidade_ok" type="checkbox" ${x.quantidade_ok?'checked':''}></label><label class="field"><span>Decisão</span><select name="decisao">${['LIBERADO','CONDICIONAL','REPROVADO'].map(d=>`<option ${x.inspecao_status===d?'selected':''}>${d}</option>`).join('')}</select></label>${field('parecer','Parecer',x.inspecao_parecer||'')}</div>${row.status==='RASCUNHO'&&role('ALMOXARIFE')?button('Salvar dados de inspeção','save-criteria'):''}</section>`).join('')}${editable?'<button type="submit" class="btn primary">Registrar inspeção</button>':''}</form>${button('Próximo: confirmar →','next','primary')}`);
 // Dados de lote/CA são registrados na conferência pelo almoxarife antes de fechar o rascunho.
 content.querySelectorAll('[data-do=save-criteria]').forEach(b=>b.onclick=()=>act(async()=>{const node=b.closest('[data-inspection]');await saveCriteria(node);await reload()}));
 async function saveCriteria(node){const data={};node.querySelectorAll('input').forEach(x=>data[x.name]=x.type==='checkbox'?x.checked:x.value);await send(`/recebimentos/${row.id}/itens/${node.dataset.inspection}`,data,'PUT')}
 content.querySelectorAll('input,select').forEach(x=>x.disabled=!(editable||row.status==='RASCUNHO'&&role('ALMOXARIFE')));
 document.querySelector('#inspection').onsubmit=e=>{e.preventDefault();act(async()=>{const itens=[...content.querySelectorAll('[data-inspection]')].map(n=>({item_id:n.dataset.inspection,decisao:n.querySelector('[name=decisao]').value,parecer:n.querySelector('[name=parecer]').value,dados:Object.fromEntries([...n.querySelectorAll('input')].map(x=>[x.name,x.type==='checkbox'?x.checked:x.value]))}));await send(`/recebimentos/${row.id}/inspecionar`,{itens});step=5;await reload()})};
 bind('next',async()=>{step=5;await render()});
}

async function confirmation(){
 const confirmed=row.status==='CONFIRMADO';
 document.querySelector('#receipt-content').innerHTML=card(`<h2>${confirmed?'Recebimento confirmado':'Revisar e confirmar'}</h2><p>NF ${esc(row.numero_nf)} · ${esc(row.pedido_numero)}. A confirmação registra sua identidade e movimenta estoque, destinos e saldo dos pedidos na mesma transação.</p><div class="table-scroll"><table><thead><tr><th>Material</th><th>Contado</th><th>Pendente OC</th><th>Inspeção</th><th>Destino</th></tr></thead><tbody>${row.itens.map(x=>`<tr><td>${esc(x.descricao)}</td><td>${num(x.qtd_contada)}</td><td>${num(x.qtd_saldo_pedido)}</td><td>${esc(x.inspecao_status||'Aguardando')}</td><td>${x.alocacoes.map(a=>`${num(a.qtd)} ${a.solicitacao_item_id?'à solicitação':'em estoque'}`).join('<br>')||'A definir'}</td></tr>`).join('')}</tbody></table></div><div class="sup-rec-actions">${row.status==='EM_INSPECAO'&&row.inspecao_status&&role('ALMOXARIFE')?button('Confirmo o recebimento · '+me.nome,'confirm','primary'):''}${confirmed&&role('ALMOXARIFE')?button('Estornar recebimento','reverse','danger'):''}${['RASCUNHO','EM_INSPECAO','PENDENTE_COMPRADOR'].includes(row.status)&&role('ALMOXARIFE')?button('Cancelar conferência e liberar saldo','cancel','danger'):''}</div><p id="confirmation-summary"></p>`);
 bind('confirm',async()=>{if(!await supConfirm('Confirmar recebimento e registrar entradas/entregas com sua identidade?'))return;const result=await send(`/recebimentos/${row.id}/confirmar`);await reload();toast(`Recebimento confirmado: ${result.resumo?.length||0} itens movimentados.`)});
 for(const [action,path,title]of [['reverse','/recebimentos/','Estornar recebimento'],['cancel','/recebimento-pedido/','Cancelar conferência']])bind(action,async()=>{const f=await supDialog({title,content:'<label class="field"><span>Motivo (mínimo 10 caracteres)</span><textarea name="motivo" minlength="10" required></textarea></label>'});if(!f)return;const endpoint=action==='reverse'?'estornar':'cancelar-conferencia';await send(path+row.id+'/'+endpoint,Object.fromEntries(f));await reload()});
}

// Extensões R3–R5 acrescentam agenda, devoluções e conciliação sem duplicar a tela base.
async function renderExtensions(kind){if(window.supRecebimentoExtension)await window.supRecebimentoExtension({kind,app,row,me,api,send,reload,esc,card,button,act,toast})}
async function init(){try{me=await api('/me');addresses=(await api('/cadastros/enderecos?size=100')).items;if(qs.get('id')){row=await api('/recebimentos/'+qs.get('id'));step=row.status==='RASCUNHO'?2:row.status==='CONFIRMADO'||row.status==='ESTORNADO'?5:4;await render()}else if(qs.get('pedido'))await identify();else await list()}catch(e){app.innerHTML=card(`<h1>Não foi possível abrir o recebimento</h1><p>${esc(e.message)}</p><a class="btn" href="${ROOT}recebimento/">Voltar</a>`)}}
await init();
