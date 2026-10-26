import {supDialog} from './dialog.js';
const API='/api/suprimentos';
const app=document.getElementById('app');
const page=location.pathname.includes('/inventario/')?'inventario':'almoxarifado';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(Number(v||0));
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const when=v=>v?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'—';
let tab='saldos',balances=[],movements=[],reserves=[],employees=[],inventories=[],suggestions=[],me=null;
const role=name=>Boolean(me?.papeis?.some(p=>p.papel===name||p.papel==='ADMIN'));
function uuid(){return crypto.randomUUID()}
async function api(path,options={},retry=true){
  const response=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...options,
    headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
  if(response.status===401){if(retry){const renew=await fetch('/unificado/suprimentos/session-renew',{credentials:'same-origin'});if(renew.ok)return api(path,options,false)}throw Error('Sessão expirada. Entre novamente.');}
  const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.detail||`HTTP ${response.status}`);return result;
}
const post=(path,body)=>api(path,{method:'POST',body:JSON.stringify(body)});
function notify(message){document.querySelector('.sup-toast')?.remove();const node=document.createElement('div');node.className='sup-toast';node.textContent=message;node.style.cssText='position:fixed;bottom:18px;right:18px;z-index:2000;background:#0f766e;color:#fff;padding:12px 16px;border-radius:10px;max-width:min(90vw,400px)';document.body.append(node);setTimeout(()=>node.remove(),4200)}
function error(e){notify(e.message||String(e))}
function dialog(title,detail,fields,submit='Salvar'){
  const content=fields.map(f=>`<label class="sup-dialog-field"><span>${esc(f.label)}</span>${f.options?`<select name="${esc(f.name)}" ${f.required?'required':''}>${f.options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}</select>`:`<input name="${esc(f.name)}" type="${esc(f.type||'text')}" value="${esc(f.value||'')}" ${f.min!==undefined?`min="${esc(f.min)}"`:''} ${f.step?`step="${esc(f.step)}"`:''} ${f.required?'required':''}>`}</label>`).join('');
  return supDialog({title,message:detail,content,submit}).then(form=>form?Object.fromEntries(form):null);
}
function frame(title,detail){return `<header class="page-head"><div><p class="eyebrow">CAMPINAS · SUPRIMENTOS</p><h1>${title}</h1><p>${detail}</p></div><div class="head-actions"><a class="btn" href="../painel/">Voltar ao painel</a></div></header>`}
const empty=message=>`<div class="sup-stock-empty">${esc(message)}</div>`;
const table=(headers,rows)=>`<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
async function refresh(){
  me=await api('/me');
  if(!me.flags?.S2){app.innerHTML=frame('Almoxarifado','Esta fase ainda não foi liberada para a unidade.');return;}
  if(page==='inventario'){
    const [a,b]=await Promise.all([api('/estoque/inventarios'),api('/estoque/saldos')]);inventories=a.items;balances=b.items;renderInventory();return;
  }
  const [a,b,c]=await Promise.all([api('/estoque/saldos'),api('/estoque/movimentos'),api('/estoque/reservas').catch(()=>({items:[]}))]);
  balances=a.items;movements=b.items;reserves=c.items;
  if(me.papeis?.some(p=>p.papel==='COMPRADOR'||p.papel==='ADMIN'))suggestions=(await api('/estoque/reposicao')).items;
  renderStock();
}
function tabs(){const options=[['saldos','Saldos'],['movimentos','Movimentos'],['consumo','Consumo por setor / CC']];if(role('ALMOXARIFE'))options.push(['separacao','Separação e entregas'],['epi','Fichas de EPI']);if(role('COMPRADOR'))options.push(['reposicao','Ponto de pedido']);return `<div class="sup-stock-tabs" role="tablist">${options.map(([id,label])=>`<button type="button" role="tab" data-tab="${id}" aria-selected="${id===tab}">${label}</button>`).join('')}</div>`}
function renderStock(){
  const total=balances.reduce((s,r)=>s+Number(r.valor_estoque),0),low=balances.filter(r=>Number(r.disponivel)<Number(r.ponto_pedido)).length;
  app.innerHTML=frame('Almoxarifado geral','Saldos, reservas e entregas do estoque de Campinas.')+
    `<div class="sup-stock-grid"><div class="sup-stock-kpi"><span>Valor em estoque</span><strong>${money(total)}</strong></div><div class="sup-stock-kpi"><span>Materiais ativos</span><strong>${balances.length}</strong></div><div class="sup-stock-kpi"><span>Abaixo do ponto de pedido</span><strong>${low}</strong></div><div class="sup-stock-kpi"><span>Reservas ativas</span><strong>${reserves.length}</strong></div></div>`+tabs()+`<section class="sup-stock-card" id="stock-panel"></section>`;
  app.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;renderStock()});renderTab();
}
function renderTab(){
  const panel=app.querySelector('#stock-panel');if(!panel)return;
  if(tab==='saldos'){
    panel.innerHTML=`<div class="sup-stock-head"><h2>Saldos por material</h2>${role('ALMOXARIFE')?'<div class="sup-stock-actions"><button data-do="entrada">Registrar entrada</button><a class="btn" href="../inventario/">Inventários</a></div>':''}</div><div class="sup-stock-filters"><label>Buscar material<input id="stock-search" placeholder="Código ou descrição"></label><label>Categoria<select id="stock-category"><option value="">Todas</option>${[...new Set(balances.map(r=>r.categoria))].map(c=>`<option>${esc(c)}</option>`).join('')}</select></label><label><span>Exibição</span><select id="stock-low"><option value="">Todos</option><option value="1">Só abaixo do ponto de pedido</option></select></label></div><div id="stock-results"></div>`;
    ['stock-search','stock-category','stock-low'].forEach(id=>panel.querySelector('#'+id).oninput=renderBalances);
    if(role('ALMOXARIFE'))panel.querySelector('[data-do="entrada"]').onclick=()=>movementForm('ENTRADA');renderBalances();return;
  }
  if(tab==='movimentos'){
    panel.innerHTML=`<div class="sup-stock-head"><h2>Livro de movimentos</h2>${role('ALMOXARIFE')?'<div class="sup-stock-actions"><button data-do="transferir">Transferir</button><button class="secondary" data-do="saida">Saída sem solicitação</button></div>':''}</div>`+
      (movements.length?table(['ID','Data','Tipo','Material','Quantidade','Custo unitário','Referência'],movements.map(r=>`<tr><td>${r.id}</td><td>${when(r.efetivado_em)}</td><td>${esc(r.tipo)}</td><td>${esc(balances.find(b=>b.material_id===r.material_id)?.descricao||r.material_id)}</td><td class="num">${num(r.quantidade)}</td><td class="num">${money(r.custo_unitario)}</td><td>${esc(r.referencia_tipo)}</td></tr>`)):empty('Nenhum movimento registrado.'));
    if(role('ALMOXARIFE')){panel.querySelector('[data-do="saida"]').onclick=()=>movementForm('ENTREGA');panel.querySelector('[data-do="transferir"]').onclick=transferForm}return;
  }
  if(tab==='consumo'){
    panel.innerHTML='<h2>Consumo por setor e centro de custo</h2><div class="sup-stock-empty">Carregando 30 dias…</div>';
    api('/estoque/consumo?dias=30').then(data=>{if(tab!=='consumo')return;panel.innerHTML='<h2>Consumo por setor e centro de custo</h2>'+
      (data.items.length?table(['Setor','Centro de custo','Material','Quantidade','Valor'],data.items.map(r=>`<tr><td>${esc(r.setor)}</td><td>${esc(r.centro_codigo)} · ${esc(r.centro_nome)}</td><td>${esc(r.material)}</td><td class="num">${num(r.quantidade)}</td><td class="num">${money(r.valor)}</td></tr>`)):empty('Sem entregas registradas nos últimos 30 dias.'))}).catch(e=>{panel.innerHTML=empty(e.message)});return;
  }
  if(tab==='separacao'){
    panel.innerHTML=`<div class="sup-stock-head"><h2>Separação e entregas</h2><a class="btn" href="../solicitacoes/">Abrir solicitações</a></div>`+
      (reserves.length?table(['Item','Material','Reservado','Entregue','Endereço'],reserves.map(r=>`<tr><td><a href="../solicitacoes/">${esc(r.solicitacao_item_id.slice(0,8))}</a></td><td>${esc(balances.find(b=>b.material_id===r.material_id)?.descricao||r.material_id)}</td><td class="num">${num(r.quantidade)}</td><td class="num">${num(r.entregue)}</td><td>${esc(r.endereco_id.slice(0,8))}</td></tr>`)):empty('Sem reservas pendentes.'));return;
  }
  if(tab==='epi'){renderEpi(panel);return;}
  if(tab==='reposicao'){
    panel.innerHTML=`<div class="sup-stock-head"><h2>Ressuprimento sugerido</h2><div class="sup-stock-actions"><button data-do="calcular">Calcular ponto de pedido</button></div></div>`+
      (suggestions.length?table(['Material','Quantidade sugerida','Motivo','Ação'],suggestions.map(r=>`<tr><td>${esc(balances.find(b=>b.material_id===r.material_id)?.descricao||r.material_id)}</td><td class="num">${num(r.quantidade)}</td><td>${esc(r.motivo)}</td><td><div class="sup-stock-actions"><button data-decision="CONFIRMADA" data-id="${r.id}">Confirmar</button><button class="secondary" data-decision="DESCARTADA" data-id="${r.id}">Descartar</button></div></td></tr>`)):empty('Sem sugestão ativa.'));
    panel.querySelector('[data-do="calcular"]').onclick=async()=>{try{const result=await post('/estoque/reposicao/calcular',{});notify(`${result.criadas.length} sugestão(ões) criada(s)`);refresh()}catch(e){error(e)}};
    panel.querySelectorAll('[data-decision]').forEach(b=>b.onclick=async()=>{try{
      const body={decisao:b.dataset.decision};
      if(body.decisao==='CONFIRMADA'){
        const centers=(await api('/cadastros/centros-custo')).items;
        const values=await dialog('Confirmar ressuprimento','A solicitação será criada em rascunho e seguirá pela aprovação normal.',[
          {name:'cc_id',label:'Centro de custo',required:true,options:centers.map(c=>({value:c.id,label:`${c.codigo} · ${c.nome}`}))}],'Criar solicitação');
        if(!values)return;body.cc_id=values.cc_id;
      }
      const result=await post(`/estoque/reposicao/${b.dataset.id}/decidir`,body);
      notify(result.solicitacao_id?'Solicitação de ressuprimento criada':'Sugestão descartada');refresh();
    }catch(e){error(e)}});return;
  }
}
function renderBalances(){const panel=app.querySelector('#stock-panel');const q=panel.querySelector('#stock-search').value.toLocaleLowerCase('pt-BR'),category=panel.querySelector('#stock-category').value,low=panel.querySelector('#stock-low').value;
  const rows=balances.filter(r=>(r.codigo+' '+r.descricao).toLocaleLowerCase('pt-BR').includes(q)&&(!category||r.categoria===category)&&(!low||Number(r.disponivel)<Number(r.ponto_pedido)));
  panel.querySelector('#stock-results').innerHTML=rows.length?table(['Código / material','Categoria','Saldo','Reservado','Disponível','Ponto pedido','Custo médio'],rows.map(r=>`<tr><td><strong>${esc(r.codigo)}</strong><br><span class="muted">${esc(r.descricao)}</span></td><td>${esc(r.categoria)}</td><td class="num">${num(r.saldo)}</td><td class="num">${num(r.reservado)}</td><td class="num ${Number(r.disponivel)<Number(r.ponto_pedido)?'warn':'ok'}">${num(r.disponivel)}</td><td class="num">${num(r.ponto_pedido)}</td><td class="num">${money(r.custo_medio)}</td></tr>`)):empty('Nenhum material corresponde aos filtros.');
}
async function addresses(){return (await api('/cadastros/enderecos')).items||[]}
async function movementForm(kind){try{
  const places=await addresses();
  const fields=[{name:'material_id',label:'Material',required:true,options:balances.map(r=>({value:r.material_id,label:`${r.codigo} · ${r.descricao}`}))},
    {name:'endereco_id',label:'Endereço',required:true,options:places.map(r=>({value:r.id,label:r.codigo}))},
    {name:'quantidade',label:'Quantidade',type:'number',min:'0.0001',step:'0.0001',required:true}];
  if(kind==='ENTRADA')fields.push({name:'custo_unitario',label:'Custo unitário (R$)',type:'number',min:'0',step:'0.01',required:true});
  else fields.push({name:'motivo',label:'Motivo da saída',required:true});
  const values=await dialog(kind==='ENTRADA'?'Registrar entrada':'Saída sem solicitação','O lançamento ficará no livro imutável.',fields,'Registrar');if(!values)return;
  const row=await post('/estoque/movimentos',{tipo:kind,...values,chave_idempotencia:uuid()});notify(`Movimento ${row.id} registrado`);refresh();
}catch(e){error(e)}}
async function transferForm(){try{
  const places=await addresses(),options=places.map(r=>({value:r.id,label:r.codigo}));
  const values=await dialog('Transferir material','Registra uma saída e uma entrada vinculadas.',[
    {name:'material_id',label:'Material',required:true,options:balances.map(r=>({value:r.material_id,label:`${r.codigo} · ${r.descricao}`}))},
    {name:'origem_id',label:'Endereço de origem',required:true,options},
    {name:'destino_id',label:'Endereço de destino',required:true,options},
    {name:'quantidade',label:'Quantidade',type:'number',min:'0.0001',step:'0.0001',required:true}],'Transferir');if(!values)return;
  await post('/estoque/transferir',{...values,chave_idempotencia:uuid()});notify('Transferência registrada');refresh();
}catch(e){error(e)}}
async function renderEpi(panel){try{const [people,records]=await Promise.all([api('/estoque/colaboradores'),api('/estoque/epi/fichas')]);employees=people.items;panel.innerHTML=`<div class="sup-stock-head"><h2>Fichas de EPI</h2><div class="sup-stock-actions"><button data-do="add-person">Cadastrar colaborador</button><button class="secondary" data-do="issue-epi">Entregar EPI</button></div></div>`+
    (records.items.length?table(['Colaborador','Material','CA','Quantidade','Data','Confirmação'],records.items.map(r=>`<tr><td>${esc(employees.find(p=>p.id===r.colaborador_id)?.nome||r.colaborador_id)}</td><td>${esc(balances.find(b=>b.material_id===r.material_id)?.descricao||r.material_id)}</td><td>${esc(r.numero_ca)}</td><td class="num">${num(r.quantidade)}</td><td>${when(r.criado_em)}</td><td>${r.confirmado_em?`Confirmado ${when(r.confirmado_em)}`:`<div class="sup-stock-actions"><button data-confirm="${r.id}">Confirmar</button></div>`}</td></tr>`)):empty('Nenhuma entrega de EPI registrada.'));
    panel.querySelector('[data-do="add-person"]').onclick=async()=>{try{const values=await dialog('Cadastrar colaborador','Informe somente os dados necessários para a ficha de EPI.',[
      {name:'nome',label:'Nome',required:true},{name:'matricula',label:'Matrícula',required:true},{name:'setor',label:'Setor'}]);if(!values)return;
      await post('/estoque/colaboradores',values);notify('Colaborador cadastrado');refresh()}catch(e){error(e)}};
    panel.querySelector('[data-do="issue-epi"]').onclick=async()=>{try{const places=await addresses(),epis=balances.filter(r=>r.categoria==='EPI');
      const values=await dialog('Entregar EPI','A entrega é bloqueada quando o CA está vencido.',[
        {name:'colaborador_id',label:'Colaborador',required:true,options:employees.map(p=>({value:p.id,label:`${p.nome} · ${p.matricula}`}))},
        {name:'material_id',label:'EPI',required:true,options:epis.map(r=>({value:r.material_id,label:r.descricao}))},
        {name:'endereco_id',label:'Endereço',required:true,options:places.map(r=>({value:r.id,label:r.codigo}))},
        {name:'numero_ca',label:'Número do CA',required:true},{name:'quantidade',label:'Quantidade',type:'number',min:'0.0001',step:'0.0001',required:true}],'Entregar');if(!values)return;
      await post('/estoque/epi/entregar',{...values,chave_idempotencia:uuid()});notify('EPI entregue; aguarda confirmação');refresh()}catch(e){error(e)}};
    panel.querySelectorAll('[data-confirm]').forEach(b=>b.onclick=async()=>{try{await post(`/estoque/epi/${b.dataset.confirm}/confirmar`,{});refresh()}catch(e){error(e)}})
  }catch(e){panel.innerHTML=empty(e.message)}}
function renderInventory(){
  app.innerHTML=frame('Inventários','Contagem cega, corte e ajuste com aprovação quando necessário.')+
    `<div class="sup-stock-grid"><div class="sup-stock-kpi"><span>Inventários abertos</span><strong>${inventories.filter(r=>r.status==='ABERTO').length}</strong></div><div class="sup-stock-kpi"><span>Aguardando aprovação</span><strong>${inventories.filter(r=>r.status==='EM_APROVACAO').length}</strong></div><div class="sup-stock-kpi"><span>Concluídos</span><strong>${inventories.filter(r=>r.status==='CONCLUIDO').length}</strong></div></div><section class="sup-stock-card"><div class="sup-stock-head"><h2>Contagens</h2><div class="sup-stock-actions"><button id="new-inventory">Abrir inventário</button><a class="btn" href="../almoxarifado/">Ver saldos</a></div></div>`+
    (inventories.length?table(['Abertura','Tipo','Corte','Situação','Ação'],inventories.map(r=>`<tr><td>${when(r.criado_em)}</td><td>${esc(r.tipo)}</td><td>${when(r.corte_em)}</td><td>${esc(r.status)}</td><td><div class="sup-stock-actions"><button class="secondary" data-sheet="${r.id}">Ficha cega</button>${r.status==='ABERTO'?`<button data-count="${r.id}">Contar</button><button class="secondary" data-close="${r.id}">Concluir</button>`:''}${r.status==='EM_APROVACAO'&&r.contador_id!==me.id?`<button data-review="${r.id}">Revisar divergência</button>`:''}</div></td></tr>`)):empty('Nenhum inventário aberto.'))+'</section>';
  app.querySelector('#new-inventory').onclick=async()=>{try{const places=await addresses();const values=await dialog('Abrir inventário','O horário de corte é registrado agora. O contador não verá o saldo.',[
    {name:'endereco_id',label:'Endereço',required:true,options:places.map(r=>({value:r.id,label:r.codigo}))},
    {name:'tipo',label:'Tipo',required:true,options:[{value:'CICLICO',label:'Cíclico'},{value:'ABERTURA',label:'Abertura'}]}],'Abrir');if(!values)return;
    await post('/estoque/inventarios',values);refresh()}catch(e){error(e)}};
  app.querySelectorAll('[data-sheet]').forEach(b=>b.onclick=async()=>{try{const data=await api(`/estoque/inventarios/${b.dataset.sheet}/ficha`);const w=window.open('','_blank');if(!w)return;w.document.write(`<h1>Ficha de contagem · Suprimentos</h1><p>Inventário ${esc(data.inventario.id)} · corte ${when(data.inventario.corte_em)}</p><table border="1" cellpadding="8"><tr><th>Material</th><th>Quantidade contada</th></tr>${data.materiais.map(m=>`<tr><td>${esc(m.codigo)} · ${esc(m.descricao)}</td><td style="width:160px"></td></tr>`).join('')}</table><script>window.print()<\/script>`);w.document.close()}catch(e){error(e)}});
  app.querySelectorAll('[data-count]').forEach(b=>b.onclick=async()=>{try{const values=await dialog('Registrar contagem','O saldo do sistema permanece oculto durante a contagem.',[
    {name:'material_id',label:'Material',required:true,options:balances.map(r=>({value:r.material_id,label:`${r.codigo} · ${r.descricao}`}))},
    {name:'quantidade',label:'Quantidade contada',type:'number',min:'0',step:'0.0001',required:true}],'Registrar');if(!values)return;
    await post(`/estoque/inventarios/${b.dataset.count}/contagens`,values);notify('Contagem registrada, sem exibir saldo');refresh()}catch(e){error(e)}});
  app.querySelectorAll('[data-close]').forEach(b=>b.onclick=async()=>{try{const result=await post(`/estoque/inventarios/${b.dataset.close}/concluir`,{});notify(result.status==='EM_APROVACAO'?'Divergência aguarda aprovação':'Inventário concluído');refresh()}catch(e){error(e)}});
  app.querySelectorAll('[data-review]').forEach(b=>b.onclick=async()=>{try{const id=b.dataset.review,counts=(await api(`/estoque/inventarios/${id}/contagens`)).items;
    const pending=counts.filter(r=>r.status==='PENDENTE_APROVACAO');if(!pending.length){notify('Sem divergência pendente');return}
    const values=await dialog('Aprovar divergência',`${pending.length} contagem(ns) pendente(s). Escolha uma e registre o parecer.`,[
      {name:'contagem_id',label:'Contagem',required:true,options:pending.map(r=>({value:r.id,label:`${balances.find(x=>x.material_id===r.material_id)?.descricao||r.material_id}: contado ${num(r.contado)}, corte ${num(r.saldo_corte)}, diferença ${num(r.diferenca)}`}))},
      {name:'parecer',label:'Parecer',required:true}],'Aprovar');if(!values)return;
    await post(`/estoque/inventarios/${id}/contagens/${values.contagem_id}/aprovar`,{parecer:values.parecer});
    await post(`/estoque/inventarios/${id}/concluir`,{});notify('Divergência aprovada e ajuste aplicado');refresh();
  }catch(e){error(e)}});
}
app.textContent='Carregando Almoxarifado…';refresh().catch(e=>{app.innerHTML=frame('Almoxarifado','Não foi possível carregar esta tela.')+`<section class="sup-stock-card">${esc(e.message)}</section>`});
