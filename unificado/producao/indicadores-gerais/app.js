(() => {
  const units = [
    {id:'campinas', name:'Campinas', color:'#ef8737'},
    {id:'pederneiras', name:'Pederneiras', color:'#238ac0'},
    {id:'ribeirao', name:'Ribeirão', color:'#4aab78'},
    {id:'noroeste', name:'Noroeste', color:'#9163c7'}
  ];
  const monthInput = document.getElementById('month');
  const feedback = document.getElementById('feedback');
  const unifiedPage=document.body.dataset.page==='campinas-unificado';
  const fmt = (value, digits=2) => value == null || !Number.isFinite(Number(value)) ? '—' :
    Number(value).toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const num = value => value == null ? null : Number(value);
  const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  monthInput.value = today.slice(0,7);

  async function token(force=false) {
    if (!force) {
      const saved=localStorage.getItem('pcp_token');
      if (saved) {
        try {
          const payload=JSON.parse(atob(saved.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
          if (payload.exp*1000>Date.now()+60000) return saved;
        } catch { /* renovar sessão */ }
      }
    }
    const response=await fetch('/unificado/mapa/api/unified/pcp-session',{credentials:'same-origin',cache:'no-store'});
    if (!response.ok) throw new Error('Sessão do Planejamento indisponível. Entre novamente no Unificado.');
    const data=await response.json();
    if (!data.access_token) throw new Error('Não foi possível renovar a sessão do Planejamento.');
    localStorage.setItem('pcp_token',data.access_token);
    return data.access_token;
  }
  async function get(path) {
    let bearer=await token();
    const headers=()=>({Authorization:'Bearer '+bearer,
      ...(path.startsWith('maodeobra/resumo?')?{'X-Unificado-Screen':'maodeobra'}:{})});
    let response=await fetch('/unificado/pcp/api/'+path,{headers:headers(),cache:'no-store'});
    if (response.status===401) {
      bearer=await token(true);
      response=await fetch('/unificado/pcp/api/'+path,{headers:headers(),cache:'no-store'});
    }
    if (!response.ok) {
      let detail='Falha '+response.status;
      try {const body=await response.json();if(typeof body.detail==='string')detail=body.detail;} catch {}
      throw new Error(detail);
    }
    return response.json();
  }
  function campinas(data, groups=['12']) {
    const days=new Map();
    for (const row of (data.kg_homem_diario || []).filter(row=>groups.includes(String(row.grupo_id)))) {
      const day=days.get(row.data) || {data:row.data,posts:0,people:0,weight:0};
      day.posts+=Number(row.postes_realizados || 0);
      day.people+=Number(row.pessoas || 0);
      day.weight+=Number(row.peso_realizado_kg || 0);
      days.set(row.data,day);
    }
    return [...days.values()].filter(day=>day.posts>0).map(day=>({
      ...day,kg:day.people>0?day.weight/day.people:null,
      pph:day.people>0?day.posts/day.people:null
    }));
  }
  function other(data) {
    return (data.dias || []).map(row=>({data:row.data,posts:Number(row.postes || 0),
      people:Number(row.homens || 0),weight:num(row.peso_kg),kg:num(row.kg_homem),
      pph:num(row.postes_homem),missing:Number(row.produtos_sem_peso || 0)}));
  }
  function campinasLabor(rows, labor) {
    const days=new Map((labor.dias || []).map(day=>[
      day.data,(day.grupos || []).find(group=>group.grupo_setor==='12')
    ]));
    return rows.map(row=>{
      const group=days.get(row.data);
      const mod=Number(group?.mod || 0),moi=Number(group?.moi || 0);
      const people=group?.lancado && !group.sem_producao?mod+moi:0;
      return {...row,mod,moi,people,kg:people>0 && row.weight!=null?row.weight/people:null,
        pph:people>0?row.posts/people:null};
    });
  }
  function campinasUnified(data, labor) {
    const days=new Map((labor.dias || []).map(day=>[day.data,day.grupos || []]));
    const production=data.kg_homem_diario || [];
    return campinas(data,['12','3','4']).map(row=>{
      const groups=days.get(row.data) || [];
      const active=new Set(production.filter(item=>item.data===row.data && Number(item.postes_realizados)>0)
        .map(item=>String(item.grupo_id)==='12'?'12':['3','4'].includes(String(item.grupo_id))?'34':null));
      let mod=0,moi=0;
      for(const id of ['12','34']){
        const group=groups.find(item=>item.grupo_setor===id);
        if(group?.lancado && !group.sem_producao){mod+=Number(group.mod || 0);moi+=Number(group.moi || 0);}
      }
      const complete=[...active].filter(Boolean).every(id=>{
        const group=groups.find(item=>item.grupo_setor===id);
        return group?.lancado && !group.sem_producao && Number(group.mod || 0)+Number(group.moi || 0)>0;
      });
      const people=complete && mod+moi>0?mod+moi:null;
      const missing=production.filter(item=>item.data===row.data && ['12','3','4'].includes(String(item.grupo_id)))
        .reduce((total,item)=>total+Number(item.produtos_sem_peso || 0),0);
      const weight=missing>0?null:row.weight;
      return {...row,mod,moi,people,weight,missing,kg:people && weight!=null?weight/people:null,
        pph:people?row.posts/people:null};
    });
  }
  function summary(rows) {
    const production=rows.filter(row=>row.posts>0);
    const completeLabor=production.every(row=>row.people>0);
    const completeWeight=production.every(row=>row.weight!=null);
    const posts=production.reduce((n,row)=>n+row.posts,0);
    const people=production.reduce((n,row)=>n+row.people,0);
    const weight=completeWeight?production.reduce((n,row)=>n+row.weight,0):null;
    return {posts,people,weight,kg:completeLabor&&completeWeight&&people>0?weight/people:null,pph:completeLabor&&people>0?posts/people:null,
      days:production.length,missing:production.filter(row=>row.weight==null || row.people<=0).length};
  }
  function renderSummary(result, definitions=units, targetId='summary') {
    const target=document.getElementById(targetId);target.replaceChildren();
    for (const unit of definitions) {
      const card=document.createElement('article');card.className='unit-card';card.style.setProperty('--unit-color',unit.color);
      const title=document.createElement('h2');title.textContent=unit.name;card.append(title);
      if (result[unit.id].error) {
        const error=document.createElement('p');error.className='error';error.textContent='Dados indisponíveis: '+result[unit.id].error;card.append(error);
      } else {
        const value=summary(result[unit.id].rows);
        const stats=document.createElement('div');stats.className='stats';
        for (const [number,label] of [[fmt(value.kg,0),'kg/homem'],[fmt(value.pph),'postes/homem']]) {
          const cell=document.createElement('div');cell.className='stat';
          const strong=document.createElement('strong');strong.textContent=number;
          const small=document.createElement('span');small.textContent=label;cell.append(strong,small);stats.append(cell);
        }
        card.append(stats);
        const totals=document.createElement('p');totals.className='totals';
        totals.textContent=`${fmt(value.posts,0)} postes · ${fmt(value.people)} homens apontados · ${value.days} dia(s) com produção`+
          (value.missing?` · ${value.missing} dia(s) com dados incompletos`:'');card.append(totals);
      }
      target.append(card);
    }
  }
  const svgNode=(name,attrs={})=>{
    const node=document.createElementNS('http://www.w3.org/2000/svg',name);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
    return node;
  };
  function renderProductionTotals(result) {
    const target=document.getElementById('chart-units');target.replaceChildren();
    const totals=units.map(unit=>({unit,posts:result[unit.id].error?null:
      result[unit.id].rows.reduce((sum,row)=>sum+Math.max(0,Number(row.posts)||0),0)}));
    const max=Math.max(1,...totals.map(item=>item.posts||0));
    for(const item of totals){
      const row=document.createElement('div');row.className='production-bar';
      row.style.setProperty('--unit-color',item.unit.color);
      const name=document.createElement('span');name.className='production-bar-name';name.textContent=item.unit.name;
      const track=document.createElement('span');track.className='production-bar-track';
      const fill=document.createElement('span');fill.className='production-bar-fill';
      fill.style.width=`${item.posts==null?0:100*item.posts/max}%`;track.append(fill);
      const value=document.createElement('span');value.className='production-bar-value';
      value.textContent=item.posts==null?'Indisponível':fmt(item.posts,0);
      row.append(name,track,value);target.append(row);
    }
    target.setAttribute('aria-label','Total produzido: '+totals.map(item=>`${item.unit.name}: ${item.posts==null?'indisponível':fmt(item.posts,0)+' postes'}`).join('; '));
  }
  function renderCombinedProduction(result,dates) {
    const failed=units.some(unit=>result[unit.id].error);
    const totals=dates.map(date=>units.reduce((sum,unit)=>sum+
      (result[unit.id].rows.find(row=>row.data===date)?.posts||0),0));
    const periodTotal=totals.reduce((sum,value)=>sum+value,0);
    const headline=document.getElementById('combined-total');headline.replaceChildren();
    headline.append(document.createTextNode(fmt(periodTotal,0)+' postes'));
    const note=document.createElement('small');note.textContent=failed?'Total parcial: unidade sem dados':'Total das 4 unidades';headline.append(note);
    const svg=document.getElementById('chart-combined');svg.replaceChildren();
    const width=Math.max(560,dates.length*30+70),height=270,left=54,right=20,top=16,bottom=43;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.setAttribute('aria-label',`${failed?'Soma parcial':'Soma das quatro unidades'}: ${fmt(periodTotal,0)} postes no período`);
    if(!dates.length){const empty=svgNode('text',{x:width/2,y:height/2,'text-anchor':'middle',fill:'#6d8193','font-size':15});empty.textContent='Sem produção apontada no período';svg.append(empty);return;}
    const max=Math.max(1,...totals)*1.12,usable=width-left-right,barWidth=Math.max(12,Math.min(27,usable/dates.length-7));
    for(let level=0;level<=4;level++){
      const value=max*level/4,y=top+(1-value/max)*(height-top-bottom);
      svg.append(svgNode('line',{x1:left,y1:y,x2:width-right,y2:y,stroke:'#e4ebf2'}));
      const label=svgNode('text',{x:left-8,y:y+4,'text-anchor':'end',fill:'#778b9e','font-size':11});label.textContent=fmt(value,0);svg.append(label);
    }
    dates.forEach((date,index)=>{
      const x=left+(index+0.5)*usable/dates.length;
      const y=top+(1-totals[index]/max)*(height-top-bottom);
      const bar=svgNode('rect',{x:x-barWidth/2,y,width:barWidth,height:height-bottom-y,rx:4,fill:'#174c77'});
      const title=svgNode('title');title.textContent=`${date.slice(8,10)}/${date.slice(5,7)}: ${fmt(totals[index],0)} postes`;bar.append(title);svg.append(bar);
      const label=svgNode('text',{x,y:height-14,'text-anchor':'middle',fill:'#778b9e','font-size':11});label.textContent=date.slice(8,10);svg.append(label);
    });
  }
  const el=(tag,cls,textValue)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(textValue!=null)node.textContent=textValue;return node;};
  const AVERAGE_COLOR='#d81b60'; // not used by any unit
  function drawUnitLine(svg,metric,rows,dates,unit,max,average) {
    svg.replaceChildren();
    const width=Math.max(620,dates.length*26+130),height=240,left=52,right=96,top=16,bottom=34;
    const digits=metric==='kg'?0:2,label=metric==='kg'?'kg/homem':'postes/homem';
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const usable=width-left-right;
    const x=index=>left+(index+0.5)*usable/Math.max(1,dates.length);
    const y=value=>top+(1-value/max)*(height-top-bottom);
    for(let level=0;level<=4;level++){
      const value=max*level/4,yy=y(value);
      svg.append(svgNode('line',{x1:left,y1:yy,x2:width-right,y2:yy,stroke:'#e4ebf2','stroke-width':1}));
      const tick=svgNode('text',{x:left-8,y:yy+4,'text-anchor':'end',fill:'#778b9e','font-size':11});
      tick.textContent=fmt(value,metric==='kg'?0:1);svg.append(tick);
    }
    const step=dates.length>16?2:1;
    dates.forEach((date,index)=>{if(index%step && index!==dates.length-1)return;
      const day=svgNode('text',{x:x(index),y:height-12,'text-anchor':'middle',fill:'#778b9e','font-size':11});
      day.textContent=date.slice(8,10);svg.append(day);
    });
    const dayMap=new Map(rows.map(row=>[row.data,row]));
    let segment=[],count=0;
    const flush=()=>{if(segment.length>1)svg.append(svgNode('polyline',{points:segment.join(' '),fill:'none',stroke:unit.color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));segment=[];};
    dates.forEach((date,index)=>{
      const value=dayMap.get(date)?.[metric];
      if(value==null || !Number.isFinite(value)){flush();return;}
      count++;segment.push(`${x(index)},${y(value)}`);
      const point=svgNode('circle',{cx:x(index),cy:y(value),r:4.5,fill:unit.color,stroke:'#fff','stroke-width':1.5});
      const title=svgNode('title');title.textContent=`${unit.name} · ${date.slice(8,10)}/${date.slice(5,7)} · ${fmt(value,digits)} ${label}`;
      point.append(title);svg.append(point);
    });flush();
    if(average!=null && Number.isFinite(average)){
      const ya=y(average),gx=width-right+8;
      svg.append(svgNode('line',{x1:left,y1:ya,x2:width-6,y2:ya,stroke:AVERAGE_COLOR,'stroke-width':2.5,'stroke-dasharray':'7 4'}));
      const ly=Math.max(ya,44),name=svgNode('text',{x:gx,y:ly-26,fill:AVERAGE_COLOR,'font-size':13,'font-weight':800});
      name.textContent='MÉDIA';svg.append(name);
      const tag=svgNode('text',{x:gx,y:ly-7,fill:AVERAGE_COLOR,'font-size':19,'font-weight':800});
      tag.textContent=fmt(average,digits);svg.append(tag);
    }
    if(!count){const empty=svgNode('text',{x:width/2,y:height/2,'text-anchor':'middle',fill:'#6d8193','font-size':15});empty.textContent='Sem dados para o período';svg.append(empty);}
    svg.setAttribute('aria-label',`${unit.name}: ${label} dia a dia`+(average!=null?`, média do mês ${fmt(average,digits)}`:''));
  }
  function drawCompareLines(svg,metric,result,dates,max) {
    svg.replaceChildren();
    const width=Math.max(560,dates.length*26+70),height=260,left=52,right=18,top=16,bottom=34;
    const digits=metric==='kg'?0:2,label=metric==='kg'?'kg/homem':'postes/homem';
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const usable=width-left-right;
    const x=index=>left+(index+0.5)*usable/Math.max(1,dates.length);
    const y=value=>top+(1-value/max)*(height-top-bottom);
    for(let level=0;level<=4;level++){
      const value=max*level/4,yy=y(value);
      svg.append(svgNode('line',{x1:left,y1:yy,x2:width-right,y2:yy,stroke:'#e4ebf2','stroke-width':1}));
      const tick=svgNode('text',{x:left-8,y:yy+4,'text-anchor':'end',fill:'#778b9e','font-size':11});
      tick.textContent=fmt(value,metric==='kg'?0:1);svg.append(tick);
    }
    const step=dates.length>16?2:1;
    dates.forEach((date,index)=>{if(index%step && index!==dates.length-1)return;
      const day=svgNode('text',{x:x(index),y:height-12,'text-anchor':'middle',fill:'#778b9e','font-size':11});
      day.textContent=date.slice(8,10);svg.append(day);
    });
    let count=0;
    for(const unit of units){
      const dayMap=new Map(result[unit.id].rows.map(row=>[row.data,row]));
      let segment=[];
      const flush=()=>{if(segment.length>1)svg.append(svgNode('polyline',{points:segment.join(' '),fill:'none',stroke:unit.color,'stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round'}));segment=[];};
      dates.forEach((date,index)=>{
        const value=dayMap.get(date)?.[metric];
        if(value==null || !Number.isFinite(value)){flush();return;}
        count++;segment.push(`${x(index)},${y(value)}`);
        const point=svgNode('circle',{cx:x(index),cy:y(value),r:3.5,fill:unit.color,stroke:'#fff','stroke-width':1.2});
        const title=svgNode('title');title.textContent=`${unit.name} · ${date.slice(8,10)}/${date.slice(5,7)} · ${fmt(value,digits)} ${label}`;
        point.append(title);svg.append(point);
      });flush();
    }
    if(!count){const empty=svgNode('text',{x:width/2,y:height/2,'text-anchor':'middle',fill:'#6d8193','font-size':15});empty.textContent='Sem dados para o período';svg.append(empty);}
    svg.setAttribute('aria-label',`Comparativo entre unidades: ${label} dia a dia`);
  }
  function renderUnitCharts(result,dates) {
    const target=document.getElementById('unit-charts');target.replaceChildren();
    // Same scale for every unit so the rows can be compared at a glance.
    const scale=metric=>Math.max(1,...units.flatMap(unit=>result[unit.id].rows.map(row=>row[metric]))
      .filter(value=>value!=null && Number.isFinite(value)))*1.15;
    const max={kg:scale('kg')*1.08,pph:scale('pph')*1.08};
    const comparison=el('div','chart-pair');
    for(const [metric,title,label] of [['kg','Quilos por homem','kg/homem'],['pph','Postes por homem','postes/homem']]){
      const card=el('section','chart-card');
      const heading=el('div','section-heading'),text=el('div');
      text.append(el('span','kicker','Comparativo por unidade'),el('h2',null,title),
        el('p',null,'As quatro unidades no mesmo gráfico, dia a dia.'));
      heading.append(text,el('span','unit-label',label));card.append(heading);
      const scroll=el('div','chart-scroll');
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');
      scroll.append(svg);card.append(scroll);
      const legend=el('div','legend');
      for(const unit of units){const item=el('span',null,unit.name);item.style.setProperty('--unit-color',unit.color);legend.append(item);}
      card.append(legend);comparison.append(card);
      drawCompareLines(svg,metric,result,dates,max[metric]);
    }
    target.append(comparison);
    for(const unit of units){
      const pair=el('div','chart-pair');
      const value=summary(result[unit.id].rows);
      for(const [metric,title,label,average] of [['kg','Quilos por homem','kg/homem',value.kg],['pph','Postes por homem','postes/homem',value.pph]]){
        const card=el('section','chart-card unit-chart');card.style.setProperty('--unit-color',unit.color);
        const heading=el('div','section-heading'),text=el('div');
        text.append(el('span','kicker',unit.name),el('h2',null,title),
          el('p',null,metric==='kg'?'Peso produzido ÷ homens apontados no dia.':'Postes produzidos ÷ homens apontados no dia.'));
        heading.append(text,el('span','unit-label',label));card.append(heading);
        if(result[unit.id].error)card.append(el('p','chart-error','Dados indisponíveis: '+result[unit.id].error));
        const scroll=el('div','chart-scroll');
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');
        scroll.append(svg);card.append(scroll);pair.append(card);
        drawUnitLine(svg,metric,result[unit.id].rows,dates,unit,max[metric],average);
      }
      target.append(pair);
    }
  }
  function renderTable(result,dates) {
    const tbody=document.getElementById('daily-rows');tbody.replaceChildren();
    const maps=Object.fromEntries(units.map(unit=>[unit.id,new Map(result[unit.id].rows.map(row=>[row.data,row]))]));
    for(const date of dates){
      const tr=document.createElement('tr');const first=document.createElement('td');first.textContent=date.slice(8,10)+'/'+date.slice(5,7);tr.append(first);
      for(const unit of units){const row=maps[unit.id].get(date);
        for(const [value,digits] of [[row?.posts,0],[row?.people,2],[row?.kg,0],[row?.pph,2]]){
          const td=document.createElement('td');td.textContent=fmt(value,digits);tr.append(td);
        }
      }tbody.append(tr);
    }
    if(!dates.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=17;td.textContent='Nenhuma produção no período.';tr.append(td);tbody.append(tr);}
  }
  function renderUnified(result) {
    const unit={id:'campinas_unificado',name:'Campinas · Unificado',color:'#176a79'};
    renderSummary({[unit.id]:result},[unit],'unified-summary');
    const charts=document.getElementById('unified-charts');charts.replaceChildren();
    const dates=result.rows.map(row=>row.data).sort(),value=summary(result.rows);
    const missingDays=result.rows.filter(row=>row.missing>0).length;
    const weightNote=document.getElementById('unified-weight-note');weightNote.hidden=!missingDays;
    weightNote.textContent=`Há ${missingDays} dia(s) com produção sem peso cadastrado. kg/homem aparece como “—” nesses dias e no resumo do mês. Confira o peso dos produtos no PCP.`;
    for(const [metric,title,label] of [['kg','Quilos por homem','kg/homem'],['pph','Postes por homem','postes/homem']]){
      const card=el('section','chart-card unit-chart');card.style.setProperty('--unit-color',unit.color);
      const heading=el('div','section-heading'),text=el('div');
      text.append(el('span','kicker','Campinas · Setores 1 + 2 + 3 + 4'),el('h2',null,title));
      heading.append(text,el('span','unit-label',label));card.append(heading);
      const scroll=el('div','chart-scroll'),svg=svgNode('svg',{role:'img'});
      scroll.append(svg);card.append(scroll);charts.append(card);
      const average=metric==='kg'?value.kg:value.pph;
      const max=Math.max(1,...result.rows.map(row=>row[metric]).filter(Number.isFinite))*1.25;
      if(metric==='kg' && missingDays && !result.rows.some(row=>Number.isFinite(row.kg))){
        svg.style.display='none';
        scroll.append(el('p','chart-empty','kg/homem indisponível. Há produtos sem peso cadastrado no período.'));
      } else drawUnitLine(svg,metric,result.rows,dates,unit,max,average);
    }
    const tbody=document.getElementById('unified-rows');tbody.replaceChildren();
    for(const row of [...result.rows].sort((a,b)=>a.data.localeCompare(b.data))){
      const tr=el('tr');
      tr.append(el('td',null,row.data.slice(8,10)+'/'+row.data.slice(5,7)));
      for(const [number,digits] of [[row.posts,0],[row.weight,0],[row.mod,2],[row.moi,2],[row.people,2],[row.kg,0],[row.pph,2]]){
        tr.append(el('td',null,fmt(number,digits)));
      }
      tbody.append(tr);
    }
    if(!result.rows.length){const tr=el('tr'),td=el('td',null,result.error?'Dados indisponíveis. Atualize os dados.':'Nenhuma produção no período.');td.colSpan=8;tr.append(td);tbody.append(tr);}
  }
  function renderMissingWeights(items, failed=false) {
    const body=document.getElementById('missing-weight-rows');body.replaceChildren();
    const total=items.reduce((sum,item)=>sum+Number(item.quantidade_produzida || 0),0);
    document.getElementById('missing-weight-total').textContent=failed?'Não foi possível consultar as pendências.':
      `${items.length} produto(s)/setor · ${fmt(total,0)} postes produzidos com peso pendente no período.`;
    for(const item of items){
      const row=el('tr');
      for(const text of [`Setor ${item.setor_id}`,item.produto_codigo || '—',item.produto_nome,
        fmt(item.quantidade_produzida,0),(item.datas || []).map(date=>date.slice(8,10)+'/'+date.slice(5,7)).join(', '),
        item.motivo==='produto_nao_vinculado'?'Modelo sem vínculo com o cadastro':'Peso não informado no cadastro'])row.append(el('td',null,text));
      body.append(row);
    }
    if(!items.length){const row=el('tr'),cell=el('td',null,failed?'Consulta indisponível. Atualize os dados.':'Nenhum poste produzido com peso pendente no período.');cell.colSpan=6;row.append(cell);body.append(row);}
  }
  async function load(){
    const month=monthInput.value;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return;
    const button=document.getElementById('reload');button.disabled=true;feedback.hidden=true;
    document.getElementById('updated').textContent='Carregando…';
    const end=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
    const endDate=month===today.slice(0,7)?today:`${month}-${String(end).padStart(2,'0')}`;
    // Shared reads: Campinas S1+S2 and the consolidated view use the same snapshot.
    let dashboardRequest;
    const dashboard=()=>dashboardRequest || (dashboardRequest=get(`dashboard?data_inicio=${month}-01&data_fim=${endDate}`));
    const labor=get(`maodeobra/resumo?data_inicio=${month}-01&data_fim=${endDate}`);
    if(unifiedPage){
      const [response]=await Promise.allSettled([Promise.all([dashboard(),labor])]);
      if(response.status==='fulfilled'){
        const [data,people]=response.value;
        renderUnified({rows:campinasUnified(data,people)});renderMissingWeights(data.pendencias_peso || []);
      }else{
        const message=response.reason?.message || 'Falha de leitura';
        renderUnified({rows:[],error:message});renderMissingWeights([],true);
        feedback.hidden=false;feedback.textContent='Não foi possível carregar Campinas Unificado: '+message;
      }
      document.getElementById('updated').textContent='Atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      button.disabled=false;return;
    }
    const requests=[
      Promise.all([
        get(`producao/campinas/indicador-importado?mes=${month}`).then(other).catch(()=>[])
          .then(rows=>rows.length?rows:dashboard().then(data=>campinas(data))),
        labor
      ]).then(([rows,labor])=>campinasLabor(rows,labor)),
      get(`producao/pederneiras/mensal?mes=${month}`).then(other),
      get(`producao/ribeirao/mensal?mes=${month}`).then(other),
      get(`producao/noroeste/mensal?mes=${month}`).then(other)
    ];
    const settled=await Promise.allSettled(requests);
    const result=Object.fromEntries(units.map((unit,index)=>[unit.id,
      settled[index].status==='fulfilled'?{rows:settled[index].value}:{rows:[],error:settled[index].reason?.message || 'Falha de leitura'}]));
    const dates=[...new Set(units.flatMap(unit=>result[unit.id].rows.map(row=>row.data)))].sort();
    renderSummary(result);renderProductionTotals(result);renderCombinedProduction(result,dates);
    renderUnitCharts(result,dates);renderTable(result,dates);
    window.renderIndicatorOverview?.({result,units,summary,fmt,dates,today,month});
    const failed=units.filter(unit=>result[unit.id].error);
    const failures=failed.map(unit=>unit.name);
    if(failures.length){feedback.hidden=false;feedback.textContent='Não foi possível carregar '+failures.join(', ')+'. Confira o acesso e atualize os dados.';}
    const screenFeedback=document.getElementById('overview-feedback');
    if(screenFeedback){screenFeedback.hidden=!failures.length;screenFeedback.textContent=feedback.textContent;}
    document.getElementById('updated').textContent='Atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    button.disabled=false;
  }
  document.getElementById('reload').addEventListener('click',load);
  const screenMonth=document.getElementById('overview-month');
  if(screenMonth){
    screenMonth.value=monthInput.value;
    screenMonth.addEventListener('change',()=>{monthInput.value=screenMonth.value;load();});
    document.getElementById('overview-reload').addEventListener('click',()=>load());
  }
  monthInput.addEventListener('change',load);
  load().catch(error=>{feedback.hidden=false;feedback.textContent=error.message;document.getElementById('reload').disabled=false;});
})();
