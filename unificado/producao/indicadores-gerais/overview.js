/* DOM rendering consumes the existing summary() output, never new API calls. */
(() => {
 let lastData=null,resizePending=false;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const svgNode=(name,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
 window.renderIndicatorOverview=({result,units,summary,fmt,dates,today,month})=>{
  lastData={result,units,summary,fmt,dates,today,month};
  const root=document.getElementById('indicator-overview');if(!root)return;
  const rows=units.map(unit=>({...unit,value:summary(result[unit.id].rows),error:result[unit.id].error}));
  const failed=rows.some(row=>row.error),total=summary(units.flatMap(unit=>result[unit.id].rows));
  const plural=window.IndicatorPresentation.plural;
  const strip=document.getElementById('overview-strip');strip.replaceChildren();
  for(const [label,value,detail] of [
   ['Postes no mês',fmt(total.posts,0),failed?'Dados parciais':'4 unidades'],
   ['Postes por homem',failed?'—':fmt(total.pph),`${fmt(total.people)} homens-dia apontados`],
   ['Kg por homem',failed?'—':fmt(total.kg,0),''],
   ['Dados incompletos',fmt(total.missing,0),rows.filter(r=>r.value.missing).map(r=>`${r.name}: ${plural(r.value.missing,'dia incompleto','dias incompletos')}`).join(' · ')||'Nenhum dia incompleto']
  ]){const cell=node('div',null,'overview-stat');cell.append(node('span',label),node('strong',value),node('small',detail));strip.append(cell);}
  const tbody=document.getElementById('overview-unit-rows'),list=document.getElementById('overview-unit-list');tbody.replaceChildren();list.replaceChildren();
  function tableRow(label,value,error){
   const tr=node('tr');for(const text of [label,error?'—':fmt(value.posts,0),error?'—':fmt(value.people),error?'—':fmt(value.days,0),error?'—':fmt(value.pph),error?'—':fmt(value.kg,0),error?'Dados indisponíveis':value.missing?plural(value.missing,'dia incompleto','dias incompletos'):'—'])tr.append(node('td',text));return tr;
  }
  for(const row of rows){
   const name=row.id==='ribeirao'?'Ribeirão Preto':row.name;
   tbody.append(tableRow(name,row.value,row.error));
   const entry=node('div',null,'overview-unit-row');entry.append(node('span',name),node('strong',row.error?'—':fmt(row.value.kg,0)+' kg/homem'),node('small',row.error?'Dados indisponíveis':plural(row.value.posts,'poste','postes')+' · '+fmt(row.value.people)+' homens-dia'),node('small',row.value.missing?plural(row.value.missing,'dia incompleto','dias incompletos'):''));list.append(entry);
  }
  document.getElementById('overview-unit-total').replaceChildren(tableRow('Total',total,failed));
  const timestamp=new Date().toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
  const monthName=new Date(month+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  document.getElementById('overview-status').textContent=`${monthName} · 4 unidades · ${plural(dates.length,'dia com produção','dias com produção')} · atualizado às ${timestamp}`;
  const values=dates.map(date=>units.reduce((sum,unit)=>sum+(result[unit.id].rows.find(row=>row.data===date)?.posts||0),0));
  const ticks=window.IndicatorPresentation.axisTicks(Math.max(0,...values));
  const svg=document.getElementById('overview-chart');svg.replaceChildren();
  const width=Math.max(280,svg.clientWidth||1100),height=210,left=40,right=8,top=10,bottom=30,max=ticks.at(-1),usable=width-left-right;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(const value of ticks){const y=top+(1-value/max)*(height-top-bottom);svg.append(svgNode('line',{x1:left,x2:width-right,y1:y,y2:y,stroke:'var(--c-line-2)'}));const text=svgNode('text',{x:left-7,y:y+4,'text-anchor':'end',fill:'var(--c-ink-3)','font-size':11});text.textContent=fmt(value,0);svg.append(text);}
  dates.forEach((date,i)=>{
   const x=left+(i+.5)*usable/dates.length,y=top+(1-values[i]/max)*(height-top-bottom),bw=Math.min(54,usable/dates.length*.64);
   const bar=svgNode('rect',{x:x-bw/2,y,width:bw,height:height-bottom-y,rx:2,fill:date===today?'color-mix(in srgb,var(--c-blue) 40%,white)':'var(--c-blue)'});
   const title=svgNode('title',{});title.textContent=`${date.slice(8)}/${date.slice(5,7)}: ${plural(values[i],'poste','postes')}${date===today?' · parcial':''}`;bar.append(title);svg.append(bar);
   const text=svgNode('text',{x,y:height-10,'text-anchor':'middle',fill:'var(--c-ink-3)','font-size':11});text.textContent=date.slice(8);svg.append(text);
  });
  document.getElementById('overview-partial').textContent=dates.includes(today)?`${today.slice(8)}/${today.slice(5,7)} parcial`:'';
  if(!dates.length){const text=svgNode('text',{x:width/2,y:height/2,'text-anchor':'middle',fill:'var(--c-ink-2)','font-size':14});text.textContent='Sem produção apontada no período';svg.append(text);}
 };
 addEventListener('resize',()=>{if(!lastData||resizePending)return;resizePending=true;requestAnimationFrame(()=>{resizePending=false;window.renderIndicatorOverview(lastData);});});
})();
