export const purchaseStatuses=['Não informado','Não necessita compra','A comprar','Em cotação','Aguardando aprovação','Pedido emitido','Material recebido'];
export const purchaseOf=row=>row.situacao_compra||'Não informado';
export const eligible=row=>row.aplicacao!=='Não se aplica'&&row.status!=='Cancelado';
export const isOpen=row=>eligible(row)&&row.status!=='Concluído';
export const isPurchasePending=row=>isOpen(row)&&['A comprar','Em cotação','Aguardando aprovação'].includes(purchaseOf(row));
export const isWaiting=row=>isOpen(row)&&(row.status==='Aguardando material'||purchaseOf(row)==='Pedido emitido');

export function summarize(rows){
  const active=rows.filter(eligible),open=active.filter(isOpen),done=active.filter(row=>row.status==='Concluído');
  return {active,open,done,purchase:open.filter(isPurchasePending),waiting:open.filter(isWaiting),
    unknownPurchase:open.filter(row=>purchaseOf(row)==='Não informado'),
    statusCounts:Object.fromEntries(['Não iniciado','Em andamento','Aguardando material','Concluído'].map(status=>[status,active.filter(row=>row.status===status).length])),
    purchaseCounts:Object.fromEntries(purchaseStatuses.map(status=>[status,open.filter(row=>purchaseOf(row)===status).length])),
    byGroup:Object.fromEntries(['M1','M2','COMUM'].map(group=>[group,{open:open.filter(row=>row.grupo===group).length,done:done.filter(row=>row.grupo===group).length}]))};
}

export function dashboardMarkup(rows,{escape,groups,gantt}){
  const s=summarize(rows),total=s.active.length,completion=total?Math.round(s.done.length/total*100):0;
  const circumference=2*Math.PI*64,doneLength=total?s.done.length/total*circumference:0;
  const statusColors={'Não iniciado':'#8093aa','Em andamento':'#276bc0','Aguardando material':'#d99224','Concluído':'#25836a'};
  const maxStatus=Math.max(1,...Object.values(s.statusCounts));
  const maxPurchase=Math.max(1,...Object.values(s.purchaseCounts));
  const bars=Object.entries(s.statusCounts).map(([label,count])=>`<button class="chart-bar-row" data-dashboard-status="${escape(label)}" aria-label="Ver ${count} atividades: ${escape(label)}"><span>${escape(label)}</span><span class="chart-bar-track"><i style="width:${count/maxStatus*100}%;background:${statusColors[label]}"></i></span><b>${count}</b></button>`).join('');
  const purchases=purchaseStatuses.map((label,index)=>`<button class="chart-bar-row purchase-bar-row" data-dashboard-purchase="${escape(label)}" aria-label="Ver ${s.purchaseCounts[label]} atividades com compra: ${escape(label)}"><span>${escape(label)}</span><span class="chart-bar-track"><i style="width:${s.purchaseCounts[label]/maxPurchase*100}%;background:${['#a1aebd','#8fa4b5','#c86b2f','#cf9a2f','#a57bba','#2d78bc','#32967c'][index]}"></i></span><b>${s.purchaseCounts[label]}</b></button>`).join('');
  const groupMax=Math.max(1,...Object.values(s.byGroup).map(row=>row.open+row.done));
  const groupBars=Object.entries(s.byGroup).map(([group,count])=>`<button class="group-chart-row" data-dashboard-group="${group}" aria-label="${escape(groups[group])}: ${count.open} abertas e ${count.done} concluídas"><span>${escape(groups[group])}</span><span class="stacked-track"><i class="open-segment" style="width:${count.open/groupMax*100}%"></i><i class="done-segment" style="width:${count.done/groupMax*100}%"></i></span><b>${count.open+count.done}</b><small>${count.open} abertas · ${count.done} concluídas</small></button>`).join('');
  const pending=s.open.filter(row=>row.alertas?.length||isPurchasePending(row)||isWaiting(row)).sort((a,b)=>Number(Boolean(b.alertas?.length))-Number(Boolean(a.alertas?.length))).slice(0,6);
  return `<section class="dashboard-intro"><h2>Painel da manutenção</h2><p>Os gráficos acompanham os filtros selecionados. Canceladas e “Não se aplica” ficam fora dos indicadores.</p></section>
    <div class="dashboard-grid">
      <section class="chart-card"><header><h3>Abertas × concluídas</h3><span>${total} atividades</span></header><div class="completion-chart"><svg viewBox="0 0 170 170" role="img" aria-label="${s.open.length} atividades abertas e ${s.done.length} concluídas. ${completion}% de conclusão."><title>Abertas e concluídas</title><circle cx="85" cy="85" r="64" fill="none" stroke="${total?'#3877c2':'#e7edf4'}" stroke-width="20"/><circle cx="85" cy="85" r="64" fill="none" stroke="#25836a" stroke-width="20" stroke-dasharray="${doneLength} ${circumference}" transform="rotate(-90 85 85)"/><text x="85" y="83" text-anchor="middle" class="donut-value">${completion}%</text><text x="85" y="104" text-anchor="middle" class="donut-label">concluído</text></svg><div class="donut-legend"><button data-dashboard-attention="open"><i class="legend-dot open-dot"></i><span>Abertas</span><b>${s.open.length}</b></button><button data-dashboard-status="Concluído"><i class="legend-dot done-dot"></i><span>Concluídas</span><b>${s.done.length}</b></button><p>${total?'Clique para ver as atividades.':'Nenhuma atividade nesta seleção.'}</p></div></div></section>
      <section class="chart-card"><header><h3>Andamento das atividades</h3><span>Quantidade por status</span></header><div class="status-chart">${bars}</div><p class="chart-footnote">Aguardando material e em andamento fazem parte das atividades abertas.</p></section>
      <section class="chart-card"><header><h3>Compras e materiais</h3><span>Somente atividades abertas</span></header><div class="purchase-highlights"><button data-dashboard-attention="purchase"><b>${s.purchase.length}</b><span>Pendentes de compra</span></button><button data-dashboard-attention="waiting"><b>${s.waiting.length}</b><span>Aguardando material</span></button></div><div class="purchase-chart">${purchases}</div><p class="chart-footnote">${s.unknownPurchase.length} aberta(s) sem situação de compra informada. Pendentes de compra = a comprar, cotação ou aprovação. Aguardando material = pedido emitido ou status de espera.</p></section>
      <section class="chart-card"><header><h3>Avanço por local</h3><span>M1, M2 e áreas comuns</span></header><div class="group-chart">${groupBars}</div><div class="inline-legend"><span><i class="legend-dot open-dot"></i>Abertas</span><span><i class="legend-dot done-dot"></i>Concluídas</span></div><h4>Precisam de atenção</h4><div class="attention-list">${pending.length?pending.map(row=>`<button data-open="${row.id}"><span><b>${escape(row.codigo)}</b> ${escape(row.atividade)}</span><small>${escape(row.alertas?.join(' · ')|| (isPurchasePending(row)?purchaseOf(row):'Aguardando material'))}</small></button>`).join(''):'<p>Nenhuma pendência de prazo, compra ou material registrada nesta seleção.</p>'}</div></section>
    </div><section class="dashboard-gantt"><div class="dashboard-gantt-head"><div><h2>Gantt da manutenção</h2><p>Datas previstas, realizadas e prazos de cada atividade.</p></div><button data-full-gantt>Abrir Gantt completo</button></div>${gantt(s.active)}</section>`;
}
