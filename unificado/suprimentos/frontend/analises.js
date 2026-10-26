const API='/api/suprimentos',ROOT='/unificado/suprimentos/',app=document.querySelector('#app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(Number(x||0));
const money=x=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(x||0));
const date=x=>x?String(x).slice(0,10).split('-').reverse().join('/'):'—';
const today=new Date(),monthAgo=new Date(today.getTime()-29*86400000);
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const state={filter:{inicio:iso(monthAgo),fim:iso(today),cc_id:'',categoria:'',fornecedor_id:''},centers:[],suppliers:[],report:null};
async function api(path){let r=await fetch(API+path,{credentials:'same-origin',cache:'no-store'});if(r.status===401){const renew=await fetch(ROOT+'session-renew',{credentials:'same-origin',cache:'no-store'}).catch(()=>null);if(renew?.ok)r=await fetch(API+path,{credentials:'same-origin',cache:'no-store'})}if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.detail||`Falha ${r.status}`)}return r.json()}
function query(){const q=new URLSearchParams();for(const [key,value] of Object.entries(state.filter))if(value)q.set(key,value);return q.toString()}
const card=(title,content,source='')=>`<section class="card"><div class="section-head"><h2>${esc(title)}</h2></div>${content}${source?`<p class="sup-ana-muted">Fonte: ${esc(source)}</p>`:''}</section>`;
const val=(value,suffix='')=>value===null||value===undefined?'—':`${n(value)}${suffix}`;
const bar=(label,value,max)=>`<div class="sup-ana-bar"><span title="${esc(label)}">${esc(label)}</span><div class="sup-ana-track"><div class="sup-ana-fill" style="width:${Math.max(0,Math.min(100,max?Number(value)/max*100:0))}%"></div></div><strong>${n(value)}</strong></div>`;
const empty=message=>`<p class="sup-ana-empty">${esc(message)}</p>`;
function filters(){const categories=['EPI','ABRASIVO','FERRAMENTA','CONSUMIVEL_PRODUCAO','MANUTENCAO','LIMPEZA_ESCRITORIO','INSUMO_USINA','QUIMICO','OUTROS'];
  return `<section class="card"><form id="sup-ana-form"><div class="sup-ana-filters">
    <label class="field"><span>Início</span><input type="date" name="inicio" value="${esc(state.filter.inicio)}"></label>
    <label class="field"><span>Fim</span><input type="date" name="fim" value="${esc(state.filter.fim)}"></label>
    <label class="field"><span>Centro de custo</span><select name="cc_id"><option value="">Todos autorizados</option>${state.centers.map(x=>`<option value="${esc(x.id)}" ${x.id===state.filter.cc_id?'selected':''}>${esc(x.codigo)} · ${esc(x.nome)}</option>`).join('')}</select></label>
    <label class="field"><span>Categoria</span><select name="categoria"><option value="">Todas</option>${categories.map(x=>`<option value="${x}" ${x===state.filter.categoria?'selected':''}>${esc(x.replaceAll('_',' '))}</option>`).join('')}</select></label>
    <label class="field"><span>Fornecedor</span><select name="fornecedor_id"><option value="">Todos</option>${state.suppliers.map(x=>`<option value="${esc(x.id)}" ${x.id===state.filter.fornecedor_id?'selected':''}>${esc(x.fantasia||x.razao)}</option>`).join('')}</select></label>
  </div><div class="sup-ana-actions"><button type="submit" class="btn primary">Aplicar filtros</button><button type="button" class="btn" data-export="csv">Exportar CSV</button><button type="button" class="btn" data-export="pdf">Exportar PDF</button></div></form></section>`}
function render(){const r=state.report;if(!r)return;
  const lead=r.lead_solicitacao,oc=r.lead_oc,stock=r.estoque,economy=r.economia;
  const kpis=`<div class="sup-ana-grid">
    <section class="card kpi"><span class="label">Solicitação → entrega</span><span class="value">${val(lead.media_dias,' dias')}</span><small>P90 ${val(lead.p90_dias,' dias')} · ${n(lead.amostra)} casos</small></section>
    <section class="card kpi"><span class="label">OC → recebimento</span><span class="value">${val(oc.media_dias,' dias')}</span><small>P90 ${val(oc.p90_dias,' dias')} · ${n(oc.amostra)} OCs</small></section>
    <section class="card kpi"><span class="label">Valor em estoque</span><span class="value">${stock.valor===null?'Por unidade':money(stock.valor)}</span><small>${stock.valor===null?'Retire o filtro por CC para consultar o total':'Giro '+n(stock.giro_periodo)+'× · cobertura '+n(stock.cobertura_dias)+' dias'}</small></section>
    <section class="card kpi"><span class="label">Economia de cotação</span><span class="value">${money(economy.economia)}</span><small>${n(economy.itens)} itens · primeira vs. escolhida</small></section></div>`;
  const consumption=r.consumo.slice(0,10),maxCost=Math.max(1,...consumption.map(x=>Number(x.valor||0)));
  const sla=r.sla.map(x=>bar(`Nível ${x.nivel}`,x.cumpridas,x.decisoes||1)+`<small>${n(x.cumpridas)} de ${n(x.decisoes)} decisões dentro do SLA</small>`).join('');
  const iqf=r.iqf.slice(0,10),maxIqf=100;
  const delayed=r.pedidos_atrasados.length?`<div class="table-scroll"><table><thead><tr><th>OC</th><th>Fornecedor</th><th>Prevista</th><th>Valor</th></tr></thead><tbody>${r.pedidos_atrasados.map(x=>`<tr><td>${esc(x.numero)}</td><td>${esc(x.fornecedor)}</td><td>${date(x.entrega_prevista)}</td><td>${money(x.valor_total)}</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhum pedido atrasado no período.');
  const zero=stock.valor===null?empty('O saldo é da unidade inteira; retire o filtro por CC.'):r.itens_zerados.length?`<div class="table-scroll"><table><thead><tr><th>Código</th><th>Material</th><th>Categoria</th></tr></thead><tbody>${r.itens_zerados.map(x=>`<tr><td>${esc(x.codigo)}</td><td>${esc(x.descricao)}</td><td>${esc(x.categoria)}</td></tr>`).join('')}</tbody></table></div>`:empty('Nenhum item zerado.');
  app.innerHTML=`<header class="page-head"><div><p class="eyebrow">CAMPINAS · SUPRIMENTOS</p><h1>Indicadores</h1><p>Compras, atendimento, estoque e fornecedores · ${date(r.periodo.inicio)} a ${date(r.periodo.fim)}</p></div></header>`+filters()+kpis+
    `<div class="sup-ana-sections">${card('Consumo por centro de custo · curva ABC',consumption.map(x=>bar(`${x.centro_custo||'Sem CC'} · ${x.material} · ${x.abc}`,x.valor,maxCost)).join('')||empty('Sem consumo no período.'),r.fontes.consumo)}
    ${card('SLA de aprovação por nível',sla||empty('Sem decisões no período.'),r.fontes.sla)}
    ${card('IQF por fornecedor',iqf.map(x=>bar(`${x.fornecedor} · ${date(x.mes)}`,x.iqf,maxIqf)).join('')||empty('Sem avaliações no período.'),r.fontes.iqf)}
    ${card('Cotações e economia',`<div class="sup-ana-duo"><div class="sup-ana-stat"><strong>${money(economy.primeira)}</strong><small>Primeira proposta</small></div><div class="sup-ana-stat"><strong>${money(economy.escolhida)}</strong><small>Escolhida · menor ${money(economy.menor)}</small></div></div>`,r.fontes.economia)}
    ${card(`Pedidos atrasados · ${r.pedidos_atrasados.length}`,delayed,r.fontes.pedidos_atrasados)}
    ${card(`Itens zerados · ${r.itens_zerados.length}`,zero,r.fontes.itens_zerados)}
    ${card('Giro e cobertura',stock.valor===null?empty('Saldo e giro são totais da unidade; retire o filtro por CC.'): `<div class="sup-ana-duo"><div class="sup-ana-stat"><strong>${n(stock.giro_periodo)}×</strong><small>Consumo / estoque atual</small></div><div class="sup-ana-stat"><strong>${n(stock.cobertura_dias)} dias</strong><small>Saldo / consumo diário</small></div></div>`,r.fontes.estoque)}</div>`;
  document.getElementById('sup-ana-form').onsubmit=event=>{event.preventDefault();const data=new FormData(event.currentTarget);for(const key of Object.keys(state.filter))state.filter[key]=String(data.get(key)||'');loadReport()};
  app.querySelectorAll('[data-export]').forEach(button=>button.onclick=()=>download(button.dataset.export));
}
async function loadReport(){try{state.report=await api('/analises/indicadores?'+query());render()}catch(error){app.innerHTML=`<section class="card"><h1>Não foi possível carregar indicadores.</h1><p>${esc(error.message)}</p><button class="btn" id="retry">Tentar novamente</button></section>`;document.getElementById('retry').onclick=loadReport}}
async function download(format){try{const response=await fetch(API+'/analises/exportar.'+format+'?'+query(),{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('Não foi possível exportar.');const blob=await response.blob();const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='suprimentos-indicadores.'+format;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}catch(error){const message=document.createElement('div');message.className='toast';message.setAttribute('role','alert');message.textContent=error.message;document.body.append(message);setTimeout(()=>message.remove(),5000)}}
async function init(){try{const [me,centers,suppliers]=await Promise.all([api('/me'),api('/cadastros/centros-custo?size=100'),api('/compras/fornecedores?size=100')]);if(!me.flags?.S5)throw Error('Indicadores ainda não estão disponíveis nesta unidade.');state.centers=centers.items;state.suppliers=suppliers.items;await loadReport()}catch(error){app.innerHTML=`<section class="card"><h1>Indicadores indisponíveis</h1><p>${esc(error.message)}</p></section>`}}
init();
