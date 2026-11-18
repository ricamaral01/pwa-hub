import {supDialog} from './dialog.js?v=1.4.3';
const ROOT='/unificado/suprimentos/',API='/api/suprimentos',app=document.querySelector('#app');
const qs=new URLSearchParams(location.search);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const field=(n,l,v='',type='text',extra='')=>`<label class="field"><span>${esc(l)}</span><input name="${n}" value="${esc(v)}" type="${type}" ${extra}></label>`;
const select=(n,l,rows,fn)=>`<label class="field"><span>${esc(l)}</span><select name="${n}" required><option value="">Selecione</option>${rows.map(x=>`<option value="${x.id}">${esc(fn(x))}</option>`).join('')}</select></label>`;
const has=(me,role)=>me.papeis.some(x=>x.papel===role||x.papel==='ADMIN');
const alm=me=>me.papeis.some(x=>x.papel==='ALMOXARIFE');
async function api(path,opt={},retry=true){const r=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...opt,headers:opt.body&&!(opt.body instanceof FormData)?{'Content-Type':'application/json'}:{}});if(r.status===401&&retry){await fetch(ROOT+'session-renew',{credentials:'same-origin'});return api(path,opt,false)}const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(typeof d.detail==='string'?d.detail:'Não foi possível concluir.');return d}
const send=(p,d={})=>api(p,{method:'POST',body:JSON.stringify(d)});
const card=s=>`<section class="card sup-r-card">${s}</section>`;
const link=row=>ROOT+'recebimento/?excecao='+row.id;
const banner=row=>`<strong>${esc(row.regularizacao_status.replaceAll('_',' '))}</strong> · prazo ${esc(row.regularizar_ate)}${row.atrasado?' · <strong>ATRASADO</strong>':''}`;
export async function exceptionList({app,me}){
 const data=await api('/recebimento-excecao');
 const node=document.createElement('section');node.className='card sup-r-card sup-exceptions';
 node.innerHTML=`<h2>Custódia sem pedido</h2><p>Material bloqueado: não compõe saldo disponível, separação ou entrega até aprovação, OC e inspeção.</p>${alm(me)?`<a class="btn danger" href="${ROOT}recebimento/?sem_pedido=novo">Registrar exceção sem pedido</a>`:''}<div class="table-scroll"><table><thead><tr><th>NF</th><th>Situação / prazo</th><th>Motivo</th></tr></thead><tbody>${data.items.map(x=>`<tr><td><a href="${link(x)}">${esc(x.numero_nf)}</a></td><td>${banner(x)}</td><td>${esc(x.motivo_sem_pedido.replaceAll('_',' '))}</td></tr>`).join('')||'<tr><td colspan="3">Nenhuma exceção registrada.</td></tr>'}</tbody></table></div>`;
 app.append(node);
}
async function detail(me,id){
 const row=await api('/recebimento-excecao/'+id),buyer=has(me,'COMPRADOR'),closed=['REGULARIZADO','DEVOLVIDO'].includes(row.regularizacao_status);
 app.innerHTML=`<a class="btn quiet" href="${ROOT}recebimento/">← Recebimentos</a><header class="page-head"><div><p class="eyebrow">SUPRIMENTOS · EXCEÇÃO CONTROLADA</p><h1>NF ${esc(row.numero_nf)} · sem pedido</h1><p>${banner(row)}</p></div></header>`+
 card(`<h2>${closed?'Histórico da custódia':'Material bloqueado'}</h2><p>${esc(row.motivo_sem_pedido.replaceAll('_',' '))} · ${esc(row.justificativa_sem_pedido)}</p><p>A contagem permanece em custódia; o saldo disponível só muda pela confirmação após a inspeção.</p><div class="table-scroll"><table><thead><tr><th>Material</th><th>Contado</th><th>Preço NF</th></tr></thead><tbody>${row.itens.map(x=>`<tr><td>${esc(x.descricao)}</td><td>${x.qtd_contada}</td><td>${Number(x.preco_nf).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>`).join('')}</tbody></table></div>`)+
 card(`<h2>Regularização</h2>${row.solicitacao_regularizacao?`<p><a href="${ROOT}solicitacao/?id=${row.solicitacao_regularizacao.id}">${esc(row.solicitacao_regularizacao.numero)}</a> · ${esc(row.solicitacao_regularizacao.status)}</p>`:''}${row.pedido_id?`<a class="btn" href="${ROOT}cotacoes/?tab=pedido&id=${row.pedido_id}">Abrir OC de regularização</a>`:''}${buyer&&!closed&&!row.pedido_id?'<button class="btn primary" data-ex-action="regularizar">'+(row.solicitacao_regularizacao?'Gerar OC após aprovação':'Solicitar regularização pela alçada normal')+'</button>':''}${alm(me)&&row.regularizacao_status==='OC_GERADA'?'<button class="btn primary" data-ex-action="liberar-conferencia">Liberar para conferência e inspeção</button>':''}${row.regularizacao_status==='REGULARIZADO'?`<a class="btn primary" href="${ROOT}recebimento/?id=${id}">Continuar recebimento vinculado à OC</a>`:''}${buyer&&['BLOQUEADO','EM_APROVACAO'].includes(row.regularizacao_status)?'<button class="btn danger" data-ex-return>Registrar devolução ao fornecedor</button>':''}`)+
 card(`<h2>Documento privado</h2>${row.anexo_path?`<a class="btn" target="_blank" rel="noopener" href="${API}/recebimentos/${id}/nf">Ver NF</a>`:alm(me)&&!closed?'<form id="ex-photo"><label class="field"><span>Foto/PDF da NF, até 12 MB</span><input name="arquivo" type="file" capture="environment" accept="image/jpeg,image/png,application/pdf" required></label><button class="btn">Anexar documento</button></form>':'Sem anexo.'}`);
 app.querySelectorAll('[data-ex-action]').forEach(b=>b.onclick=()=>supDialog({title:b.textContent,message:'A operação será registrada com sua identidade e não libera estoque antes da confirmação.',onSubmit:async()=>{await send('/recebimento-excecao/'+id+'/'+b.dataset.exAction);await detail(me,id)}}));
 app.querySelector('[data-ex-return]')?.addEventListener('click',()=>supDialog({title:'Devolver custódia bloqueada',danger:true,content:field('numero_nf_devolucao','NF de devolução (quando houver)','','text','maxlength="40"')+'<label class="field"><span>Motivo</span><textarea name="motivo" minlength="10" required></textarea></label>',onSubmit:async f=>{await send('/recebimento-excecao/'+id+'/devolver',Object.fromEntries(f));await detail(me,id)}}));
 app.querySelector('#ex-photo')?.addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await api('/recebimento-excecao/'+id+'/nf',{method:'POST',body:new FormData(e.target)});await detail(me,id)}catch(e){showError(e)}finally{button.disabled=false}});
}
function showError(e){let n=app.querySelector('[role=alert]');if(!n){n=document.createElement('p');n.setAttribute('role','alert');app.prepend(n)}n.textContent=e.message}
async function create(me){
 if(!alm(me))throw Error('Registro excepcional exige papel ALMOXARIFE.');
 const [cc,options,mat,address]=await Promise.all([api('/cadastros/centros-custo?size=100'),api('/recebimento-excecao/opcoes'),api('/cadastros/materiais?size=100'),api('/cadastros/enderecos?size=100')]);const sup={items:options.fornecedores};
 app.innerHTML=`<a class="btn quiet" href="${ROOT}recebimento/">← Recebimentos</a><header class="page-head"><div><h1>Exceção sem pedido</h1><p>Entrada em custódia bloqueada, com motivo obrigatório e aprovação normal para regularização.</p></div></header>`+card(`<form id="ex-create"><div class="sup-rec-fields">${select('cc_id','Centro de custo',cc.items,x=>x.codigo+' · '+x.nome)}${select('fornecedor_id','Fornecedor',sup.items,x=>x.razao)}${field('numero_nf','Número da NF','','text','required maxlength="40"')}<label class="field"><span>Motivo</span><select name="motivo"><option value="COMPRA_EMERGENCIAL">Compra emergencial</option><option value="AMOSTRA">Amostra</option><option value="BONIFICACAO">Bonificação</option><option value="OUTRO">Outro</option></select></label></div><label class="field"><span>Justificativa</span><textarea name="justificativa" minlength="10" required></textarea></label><div id="ex-lines"></div><button class="btn" type="button" id="ex-add">Adicionar material</button><button class="btn danger" type="submit">Registrar material bloqueado</button></form>`);
 const line=()=>`<section class="sup-rec-item" data-ex-line><div class="sup-rec-fields">${select('material_id','Material',mat.items.filter(x=>x.dominio==='almoxarifado'),x=>x.codigo+' · '+x.descricao)}${select('endereco_id','Endereço de custódia',address.items,x=>x.codigo)}${field('qtd','Quantidade contada',1,'number','min="0.0001" step="0.0001" required')}${field('preco_nf','Preço unitário NF (R$)',0,'number','min="0" step="0.01" required')}</div><button class="btn" type="button" data-ex-remove>Remover item</button></section>`;
 app.querySelector('#ex-lines').innerHTML=line();app.querySelector('#ex-add').onclick=()=>app.querySelector('#ex-lines').insertAdjacentHTML('beforeend',line());
 app.querySelector('#ex-lines').onclick=e=>{if(e.target.matches('[data-ex-remove]')&&app.querySelectorAll('[data-ex-line]').length>1)e.target.closest('[data-ex-line]').remove()};
 app.querySelector('#ex-create').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),button=e.target.querySelector('[type=submit]');button.disabled=true;try{
  const profile=sup.items.find(x=>x.id===f.get('fornecedor_id'));
  if(!profile)throw Error('Fornecedor precisa estar cadastrado nesta unidade.');
  const itens=[...app.querySelectorAll('[data-ex-line]')].map(n=>Object.fromEntries([...n.querySelectorAll('select,input')].map(x=>[x.name,x.value])));
  const row=await send('/recebimento-excecao',{...Object.fromEntries(f),fornecedor_unidade_id:profile.id,itens});location.href='?excecao='+row.id;
 }catch(e){showError(e)}finally{button.disabled=false}};
}
const previous=window.supRecebimentoExtension;
window.supRecebimentoExtension=async env=>{await previous?.(env);if(env.kind==='list')await exceptionList(env)};
if(qs.has('excecao')||qs.has('sem_pedido')){
 try{const me=await api('/me');if(qs.has('excecao'))await detail(me,qs.get('excecao'));else await create(me)}catch(e){showError(e)}
}
