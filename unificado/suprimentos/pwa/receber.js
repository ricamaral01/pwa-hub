import {supDialog} from '../frontend/dialog.js?v=1.4.3';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null,stop=()=>{},period='hoje',networkCleanup=()=>{};
export async function receberView(env){
 const {node,me,api,post,get,put,notice}=env;
 if(!me.flags?.S3C||!me.papeis.some(x=>x.papel==='ALMOXARIFE')){node.innerHTML='<h1>Receber</h1><p>Acesso disponível ao almoxarife com S3C habilitada.</p>';return}
 stop();networkCleanup();
 async function queue(){
  active=null;node.innerHTML='<h1>Receber materiais</h1><p>Carregando agenda…</p>';
  if(!navigator.onLine){const old=await get('cache','receber-agenda-'+period);if(!old){node.innerHTML='<h1>Receber materiais</h1><p>Conecte-se uma vez para carregar a agenda.</p>';await drafts();return}agenda(old.value);await drafts();return}
  const data=await api('/recebimento-acompanhamento/agenda?periodo='+period);await put('cache','receber-agenda-'+period,{value:data});agenda(data);await drafts();
 }
 function agenda(data){
  node.innerHTML=`<h1>Receber materiais</h1><p>Agenda do dia. A confirmação exige conexão; a contagem pode ficar salva neste aparelho.</p><label class="field"><span>Agenda</span><select id="recv-period"><option value="hoje">Hoje</option><option value="semana">Semana e atrasados</option><option value="atrasados">Atrasados</option><option value="todos">Todos</option></select></label><div class="card"><form id="recv-search"><label class="field"><span>OC ou chave da DANFE</span><input name="busca" placeholder="OC-00012 ou chave de 44 dígitos" required></label><div class="btn-row"><button class="btn primary">Identificar</button><button class="btn" type="button" id="recv-camera">Ler DANFE</button></div></form><div id="recv-video"></div></div>${data.items.map(x=>`<button class="card request-card" type="button" data-recv-order="${x.numero}"><strong>${esc(x.numero)} · ${esc(x.razao)}</strong><p>${esc(x.data_prevista||'Sem previsão')} · ${x.itens_pendentes} item(ns)${x.parou_producao?' · PRODUÇÃO PARADA':''}</p></button>`).join('')||'<div class="card">Nenhuma entrega prevista.</div>'}<div id="recv-results"></div>`;
  node.querySelector('#recv-period').value=period;node.querySelector('#recv-period').onchange=e=>{period=e.target.value;queue().catch(noticeError)};
  node.querySelector('#recv-search').onsubmit=e=>{e.preventDefault();identify(new FormData(e.target).get('busca')).catch(noticeError)};
  node.querySelectorAll('[data-recv-order]').forEach(b=>b.onclick=()=>identify(b.dataset.recvOrder).catch(noticeError));
  node.querySelector('#recv-camera').onclick=()=>scan().catch(noticeError);
 }
 async function identify(term){
  if(!navigator.onLine)throw Error('Identificar e abrir uma NF exigem conexão. Reabra a contagem salva abaixo.');
  const data=await api('/recebimento-pedido/identificar?busca='+encodeURIComponent(term));
  node.querySelector('#recv-results').innerHTML=`<div class="card"><h2>Pedidos do fornecedor</h2><form id="recv-choose">${data.items.map(x=>`<label class="recv-choice"><input type="checkbox" name="pedido_ids" value="${x.id}" ${data.items.length===1?'checked':''}><span>${esc(x.numero)} · ${esc(x.razao)}</span></label>`).join('')||'<p>Nenhum pedido com saldo disponível.</p>'}<label class="field"><span>Número da NF</span><input name="numero_nf" value="${esc(data.nf.numero_nf||'')}" required maxlength="40"></label><input type="hidden" name="chave_nf" value="${esc(data.nf.chave_nf||'')}">${data.items.length?'<button class="btn primary">Abrir conferência</button>':''}</form></div>`;
  node.querySelector('#recv-choose').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const row=await post('/recebimento-pedido/rascunhos',{pedido_ids:f.getAll('pedido_ids'),numero_nf:f.get('numero_nf'),chave_nf:f.get('chave_nf')});await open(row.id)}catch(e){noticeError(e)}};
 }
 async function scan(){
  stop();if(!navigator.mediaDevices?.getUserMedia||!('BarcodeDetector'in window))throw Error('Leitor indisponível neste navegador. Digite a chave de 44 dígitos.');
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}),holder=node.querySelector('#recv-video');holder.innerHTML='<video autoplay playsinline class="scan-video"></video><button class="btn" type="button">Fechar câmera</button>';
  const video=holder.querySelector('video');video.srcObject=stream;let live=true;stop=()=>{live=false;stream.getTracks().forEach(x=>x.stop());holder.innerHTML=''};holder.querySelector('button').onclick=stop;window.addEventListener('pagehide',stop,{once:true});
  try{const reader=new BarcodeDetector({formats:['code_128']});await video.play();while(live){await new Promise(r=>setTimeout(r,300));if(!live)break;const values=await reader.detect(video);const found=values.find(x=>/^\d{44}$/.test(x.rawValue));if(found){stop();await identify(found.rawValue)}}}finally{stop()}
 }
 async function open(id){
  stop();let row;
  if(navigator.onLine){row=await api('/recebimentos/'+id);await put('cache','receber-doc-'+id,{value:row})}
  else row=(await get('cache','receber-doc-'+id))?.value;
  if(!row)throw Error('Conecte-se para abrir esta NF pela primeira vez.');
  active=row;
  const draft=(await get('cache','receber-contagem-'+id))?.value||{};
  node.innerHTML=`<button class="btn" id="recv-back">← Agenda</button><h1>NF ${esc(row.numero_nf)}</h1><p>${esc(row.pedido_numero)} · ${esc(row.status)}</p><p>Almoxarife: <strong>${esc(me.nome)}</strong></p><form id="recv-counts">${row.itens.map(x=>`<section class="card" data-recv-item="${x.id}"><h2>${esc(x.descricao)}</h2><p>${esc(x.unidade_medida||'')} · ${x.contagem_cega?'Contagem cega':`NF ${x.qtd_nf} · pendente OC ${x.qtd_saldo_pedido}`}</p><label class="field"><span>Quantidade contada</span><div class="recv-count-buttons"><button class="btn" type="button" data-delta="-1" aria-label="Diminuir contagem">−</button><input type="number" min="0" step="0.0001" inputmode="decimal" name="qtd_contada" value="${draft[x.id]??(x.contagem_registrada?x.qtd_contada:'')}" required><button class="btn" type="button" data-delta="1" aria-label="Aumentar contagem">+</button></div></label><p>${esc(x.inspecao_status||'Inspeção pendente')}</p></section>`).join('')}<button class="btn primary" ${row.status!=='RASCUNHO'?'disabled':''}>Salvar contagem${navigator.onLine?' no servidor':' neste aparelho'}</button></form><div class="card"><h2>Foto da NF</h2><input id="recv-photo" type="file" capture="environment" accept="image/jpeg,image/png,application/pdf"><button class="btn" id="recv-send-photo">Anexar foto/documento</button><p>A foto é privada. O envio exige conexão.</p></div><div class="card"><h2>Destino e inspeção</h2><p>Os destinos sugeridos atendem as solicitações prioritárias. A Qualidade registra a inspeção antes da confirmação.</p><button class="btn" id="recv-destination" ${row.status!=='RASCUNHO'||!navigator.onLine?'disabled':''}>Confirmar destinos sugeridos e conferir NF</button><a class="btn" target="_blank" rel="noopener" href="/unificado/?view=${encodeURIComponent('suprimentos/recebimento/?id='+id)}">Revisar destinos / inspeção na tela completa</a></div><div class="card"><h2>Assinatura de confirmação</h2><label class="recv-choice"><input id="recv-sign" type="checkbox"><span>Eu, ${esc(me.nome)}, confirmei os materiais, quantidades e destinos desta NF.</span></label><button class="btn primary" id="recv-confirm" ${!navigator.onLine||row.status!=='EM_INSPECAO'||!row.inspecao_status?'disabled':''}>Confirmar recebimento com minha identidade</button><p>Sem conexão ou sem inspeção concluída, a confirmação fica bloqueada.</p></div>`;
  if(row.status!=='RASCUNHO')node.querySelectorAll('#recv-counts input,#recv-counts button').forEach(x=>x.disabled=true);
  if(row.anexo_path||row.status!=='RASCUNHO')node.querySelector('#recv-send-photo').disabled=true;
  const connectivity=()=>{
   const save=node.querySelector('#recv-counts [type=submit]')||node.querySelector('#recv-counts>button');
   if(save)save.textContent=navigator.onLine?'Salvar contagem no servidor':'Salvar contagem neste aparelho';
   node.querySelector('#recv-confirm').disabled=!navigator.onLine||row.status!=='EM_INSPECAO'||!row.inspecao_status;
   node.querySelector('#recv-destination').disabled=!navigator.onLine||row.status!=='RASCUNHO';
  };
  networkCleanup();window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);
  networkCleanup=()=>{window.removeEventListener('online',connectivity);window.removeEventListener('offline',connectivity)};connectivity();
  node.querySelector('#recv-back').onclick=()=>{networkCleanup();queue().catch(noticeError)};
  const values=()=>Object.fromEntries([...node.querySelectorAll('[data-recv-item]')].map(n=>[n.dataset.recvItem,n.querySelector('input').value]));
  const saveLocal=async()=>{await put('cache','receber-contagem-'+id,{value:values()});await put('cache','receber-ultimo',{value:id})};
  node.querySelectorAll('[data-delta]').forEach(b=>b.onclick=async()=>{const input=b.parentElement.querySelector('input');input.value=String(Math.max(0,Number(input.value||0)+Number(b.dataset.delta)));await saveLocal()});
  node.querySelectorAll('[name=qtd_contada]').forEach(n=>n.oninput=()=>saveLocal().catch(noticeError));
  node.querySelector('#recv-counts').onsubmit=async e=>{e.preventDefault();try{await saveLocal();if(navigator.onLine){for(const [iid,qty]of Object.entries(values()))await api('/recebimentos/'+id+'/itens/'+iid,{method:'PUT',body:JSON.stringify({qtd_contada:qty})});await open(id);notice('Contagens salvas no servidor.')}else notice('Contagens salvas neste aparelho para esta identidade e unidade.')}catch(e){noticeError(e)}};
  node.querySelector('#recv-send-photo').onclick=async()=>{try{if(!navigator.onLine)throw Error('Conecte-se para anexar a foto.');const photo=node.querySelector('#recv-photo').files[0];if(!photo)throw Error('Escolha uma foto da NF.');const body=new FormData();body.append('arquivo',photo);await api('/recebimentos/'+id+'/nf',{method:'POST',body});notice('Foto privada anexada.')}catch(e){noticeError(e)}};
  node.querySelector('#recv-destination').onclick=async()=>{try{const d=await api('/recebimento-pedido/'+id+'/destinos');await supDialog({title:'Confirmar destinos sugeridos',message:'As quantidades serão destinadas às solicitações prioritárias; a sobra ficará em estoque. Use a tela completa para ajustar.',onSubmit:async()=>{await api('/recebimento-pedido/'+id+'/destinos',{method:'PUT',body:JSON.stringify({items:d.items})});await post('/recebimentos/'+id+'/conferir',{confirmo_campos_nf:true});await open(id)}})}catch(e){noticeError(e)}};
  node.querySelector('#recv-confirm').onclick=async()=>{try{if(!navigator.onLine)throw Error('Conecte-se para confirmar.');if(!node.querySelector('#recv-sign').checked)throw Error('Marque sua confirmação de identidade.');await supDialog({title:'Confirmar recebimento',message:'Assinatura por sessão autenticada: '+me.nome,onSubmit:async()=>{await post('/recebimentos/'+id+'/confirmar',{});await open(id);notice('Recebimento confirmado.')}})}catch(e){noticeError(e)}};
 }
 function noticeError(e){notice(e.message||String(e))}
 async function drafts(){
 const last=(await get('cache','receber-ultimo'))?.value;
 const rows=navigator.onLine?(await api('/recebimentos?size=100')).items.filter(r=>['RASCUNHO','PENDENTE_COMPRADOR','EM_INSPECAO','CONFIRMADO'].includes(r.status)&&(r.tipo!=='SEM_PEDIDO'||r.regularizacao_status==='REGULARIZADO')).slice(0,20):[];
 const holder=document.createElement('div');holder.className='card';holder.innerHTML='<h2>Conferências em andamento</h2>'+rows.map(r=>`<button class="btn" data-recv-resume="${r.id}">NF ${esc(r.numero_nf)}</button>`).join('')+(last?`<button class="btn" data-recv-resume="${last}">Retomar última contagem salva</button>`:'');node.append(holder);holder.querySelectorAll('[data-recv-resume]').forEach(b=>b.onclick=()=>open(b.dataset.recvResume).catch(noticeError));
 }
 await queue();
}
export function stopReceivingCamera(){stop();networkCleanup()}
