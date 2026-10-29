(() => {
  const units = [
    {id:'campinas', name:'Campinas', color:'#ef8737'},
    {id:'pederneiras', name:'Pederneiras', color:'#238ac0'},
    {id:'ribeirao', name:'Ribeirão', color:'#4aab78'},
    {id:'noroeste', name:'Noroeste', color:'#9163c7'}
  ];
  const monthInput = document.getElementById('month');
  const feedback = document.getElementById('feedback');
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
    let response=await fetch('/unificado/pcp/api/'+path,{headers:{Authorization:'Bearer '+bearer},cache:'no-store'});
    if (response.status===401) {
      bearer=await token(true);
      response=await fetch('/unificado/pcp/api/'+path,{headers:{Authorization:'Bearer '+bearer},cache:'no-store'});
    }
    if (!response.ok) {
      let detail='Falha '+response.status;
      try {const body=await response.json();if(typeof body.detail==='string')detail=body.detail;} catch {}
      throw new Error(detail);
    }
    return response.json();
  }
  function campinas(data) {
    const days=new Map();
    for (const row of data.kg_homem_diario || []) {
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
  function renderSummary(result) {
    const target=document.getElementById('summary');target.replaceChildren();
    for (const unit of units) {
      const card=document.createElement('article');card.className='unit-card';card.style.setProperty('--unit-color',unit.color);
      const title=document.createElement('h2');title.textContent=unit.name;card.append(title);
      if (result[unit.id].error) {
        const error=document.createElement('p');error.className='error';error.textContent='Dados indisponíveis: '+result[unit.id].error;card.append(error);
      } else {
        const value=summary(result[unit.id].rows);
        const stats=document.createElement('div');stats.className='stats';
        for (const [number,label] of [[fmt(value.kg),'kg/homem'],[fmt(value.pph),'postes/homem']]) {
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
    const width=Math.max(740,dates.length*34+90),height=270,left=54,right=20,top=16,bottom=43;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.minWidth=width+'px';
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
  const concreteVolumeByCode = {'935':0.18,'938':0.18,'941':0.22,'943':0.22,'936':0.30,'939':0.30,'13580':0.25};
  function concreteVolume(row) {
    const code=String(row.codigo_produto || '').trim();
    if (concreteVolumeByCode[code]) return concreteVolumeByCode[code];
    if (row.setor==='Setor 4') return 0.08;
    const model=String(row.modelo || '').toUpperCase();
    if (model.includes('1 CX')) return 0.18;
    if (model.includes('2 CX') || model.includes('2CX')) return 0.22;
    if (model.includes('3 CX') || model.includes('3CX')) return 0.26;
    if (model.includes('4 CX') || model.includes('4CX') || model.includes('600')) return 0.30;
    if (model.includes('300')) return 0.22;
    if (model.includes('DTB') || model.includes('DTD')) return 0.25;
    if (model.includes('CEMIG')) return 0.18;
    if (model.includes('6,0 X 90') || model.includes('7,5 X 90')) return 0.08;
    if (model.includes('7,0 X 150') || model.includes('7,5 X 200')) return 0.12;
    return 0.20;
  }
  function concreteIsGood(row) {
    const type=String(row.tipo_concreto || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    return !type.includes('SECO') && !type.includes('SEGREGAD') && !type.includes('EXSUDAD');
  }
  async function fetchConcreteRows(start,end) {
    const all=[];
    for(let page=0;page<30;page++) {
      const query=new URLSearchParams({
        select:'id,data_fabricacao,data_hora,setor,forma,modelo,codigo_produto,tipo_concreto,status',
        status:'in.(LIBERADO,INSPECIONADO)',order:'id.asc',limit:'1000',offset:String(page*1000)
      });
      query.append('data_fabricacao','gte.'+start);
      query.append('data_fabricacao','lte.'+end);
      const response=await fetch('/unificado/mapa/api/rest/v1/producao?'+query,{
        credentials:'same-origin',cache:'no-store',headers:{'X-Unificado-Screen':'produtividade'}
      });
      if(!response.ok) throw new Error('Não foi possível consultar a concretagem de Campinas ('+response.status+').');
      const pageRows=await response.json();
      if(!Array.isArray(pageRows)) throw new Error('Resposta inválida da concretagem de Campinas.');
      all.push(...pageRows);
      if(pageRows.length<1000) return all;
    }
    throw new Error('O período tem mais registros do que a consulta comporta.');
  }
  function renderConcrete(rows) {
    const distinct=new Map();
    for(const row of rows) {
      if(!row.data_fabricacao || !row.setor || !row.forma) continue;
      const key=`${row.data_fabricacao}|${row.setor}|${row.forma}`;
      const previous=distinct.get(key);
      if(!previous || (previous.status!=='LIBERADO' && row.status==='LIBERADO')) distinct.set(key,row);
    }
    const production=[...distinct.values()];
    const sectors=['Setor 1','Setor 2','Setor 3','Setor 4'];
    const totals=Object.fromEntries(sectors.map(sector=>[sector,{good:0,bad:0}]));
    for(const row of production) {
      if(!totals[row.setor]) continue;
      totals[row.setor][concreteIsGood(row)?'good':'bad']+=concreteVolume(row);
    }
    const good=sectors.reduce((sum,sector)=>sum+totals[sector].good,0);
    const bad=sectors.reduce((sum,sector)=>sum+totals[sector].bad,0);
    const total=good+bad;
    const donut=document.getElementById('concrete-donut');
    const goodShare=total>0?100*good/total:0;
    donut.style.background=total>0?`conic-gradient(#15966c 0 ${goodShare}%, #dc5454 ${goodShare}% 100%)`:'#e8eef3';
    donut.setAttribute('aria-label',`Concreto bom ${fmt(good,2)} m³; fora do padrão ${fmt(bad,2)} m³`);
    document.getElementById('concrete-total').textContent=fmt(total,1);
    const legend=document.getElementById('concrete-legend');legend.replaceChildren();
    for(const [label,value,color] of [['Bom',good,'#15966c'],['Fora do padrão',bad,'#dc5454']]) {
      const item=document.createElement('span');item.style.setProperty('--concrete-color',color);
      item.textContent=`${label}: ${fmt(value,2)} m³`;legend.append(item);
    }
    const sectorBox=document.getElementById('concrete-sectors');sectorBox.replaceChildren();
    const max=Math.max(1,...sectors.map(sector=>totals[sector].good+totals[sector].bad));
    for(const sector of sectors) {
      const values=totals[sector];
      const row=document.createElement('div');row.className='concrete-sector-row';
      const head=document.createElement('div');head.className='concrete-sector-head';
      const name=document.createElement('span');name.textContent=sector;
      const amount=document.createElement('span');amount.textContent=fmt(values.good+values.bad,2)+' m³';
      head.append(name,amount);
      const track=document.createElement('div');track.className='concrete-sector-track';
      for(const [kind,className] of [['good','concrete-sector-good'],['bad','concrete-sector-bad']]) {
        const bar=document.createElement('span');bar.className=className;
        bar.style.width=(100*values[kind]/max)+'%';track.append(bar);
      }
      row.append(head,track);sectorBox.append(row);
    }
    sectorBox.setAttribute('aria-label',sectors.map(sector=>`${sector}: ${fmt(totals[sector].good+totals[sector].bad,2)} m³`).join('; '));
    const daySector=new Map();
    for(const row of production) {
      if(!row.data_hora) continue;
      const key=`${row.data_fabricacao}|${row.setor}`;
      if(!daySector.has(key)) daySector.set(key,[]);
      daySector.get(key).push(new Date(row.data_hora).getTime());
    }
    const daily=new Map();
    for(const [key,times] of daySector) {
      times.sort((a,b)=>a-b);
      const day=key.split('|')[0];
      if(!daily.has(day)) daily.set(day,[]);
      for(let index=1;index<times.length;index++) {
        const interval=(times[index]-times[index-1])/60000;
        if(interval>0 && interval<=60) daily.get(day).push(interval);
      }
    }
    const dayMeans=[...daily.values()].filter(values=>values.length).map(values=>values.reduce((sum,value)=>sum+value,0)/values.length);
    document.getElementById('concrete-cycle').textContent=dayMeans.length?fmt(dayMeans.reduce((sum,value)=>sum+value,0)/dayMeans.length,0)+' min':'—';
    document.getElementById('concrete-cycle-detail').textContent=dayMeans.length?`Média de ${dayMeans.length} dia(s) com ciclos válidos`:'Sem ciclos válidos no período';
    document.getElementById('concrete-feedback').textContent=production.length?`${fmt(production.length,0)} formas consideradas. Volumes estimados por modelo de forma.`:'Sem concretagens de Campinas no período.';
  }
  async function loadConcrete(start,end) {
    document.getElementById('concrete-feedback').textContent='Carregando indicadores de Campinas…';
    try { renderConcrete(await fetchConcreteRows(start,end)); }
    catch(error) {
      document.getElementById('concrete-sectors').textContent='Dados indisponíveis.';
      document.getElementById('concrete-cycle-detail').textContent='Dados indisponíveis.';
      document.getElementById('concrete-feedback').textContent=error.message;
    }
  }
  function renderChart(id,metric,result,dates) {
    const svg=document.getElementById(id);svg.replaceChildren();
    const width=Math.max(740,dates.length*28+90),height=280,left=55,right=22,top=18,bottom=42;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.style.minWidth=width+'px';
    const values=units.flatMap(unit=>result[unit.id].rows.map(row=>row[metric])).filter(value=>value!=null && Number.isFinite(value));
    const max=Math.max(1,...values)*1.12;
    const x=index=>left+(index*(width-left-right)/Math.max(1,dates.length-1));
    const y=value=>top+(1-value/max)*(height-top-bottom);
    for(let level=0;level<=4;level++){
      const value=max*level/4,yy=y(value);
      svg.append(svgNode('line',{x1:left,y1:yy,x2:width-right,y2:yy,stroke:'#e4ebf2','stroke-width':1}));
      const label=svgNode('text',{x:left-8,y:yy+4,'text-anchor':'end',fill:'#778b9e','font-size':11});
      label.textContent=fmt(value,metric==='kg'?0:1);svg.append(label);
    }
    const step=dates.length>20?3:dates.length>12?2:1;
    dates.forEach((date,index)=>{if(index%step && index!==dates.length-1)return;
      const label=svgNode('text',{x:x(index),y:height-14,'text-anchor':'middle',fill:'#778b9e','font-size':11});
      label.textContent=date.slice(8,10);svg.append(label);
    });
    for(const unit of units){
      const dayMap=new Map(result[unit.id].rows.map(row=>[row.data,row]));
      let segment=[];
      const flush=()=>{if(segment.length>1)svg.append(svgNode('polyline',{points:segment.join(' '),fill:'none',stroke:unit.color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));segment=[];};
      dates.forEach((date,index)=>{
        const value=dayMap.get(date)?.[metric];
        if(value==null || !Number.isFinite(value)){flush();return;}
        segment.push(`${x(index)},${y(value)}`);
        const point=svgNode('circle',{cx:x(index),cy:y(value),r:4.5,fill:unit.color,stroke:'#fff','stroke-width':1.5});
        const title=svgNode('title');title.textContent=`${unit.name} · ${date.slice(8,10)}/${date.slice(5,7)} · ${fmt(value)} ${metric==='kg'?'kg/homem':'postes/homem'}`;
        point.append(title);svg.append(point);
      });flush();
    }
    if(!values.length){const label=svgNode('text',{x:width/2,y:height/2,'text-anchor':'middle',fill:'#6d8193','font-size':15});label.textContent='Sem dados para o período';svg.append(label);}
    const legend=document.getElementById(id==='chart-weight'?'legend-weight':'legend-posts');legend.replaceChildren();
    for(const unit of units){const item=document.createElement('span');item.style.setProperty('--unit-color',unit.color);item.textContent=unit.name;legend.append(item);}
  }
  function renderTable(result,dates) {
    const tbody=document.getElementById('daily-rows');tbody.replaceChildren();
    const maps=Object.fromEntries(units.map(unit=>[unit.id,new Map(result[unit.id].rows.map(row=>[row.data,row]))]));
    for(const date of dates){
      const tr=document.createElement('tr');const first=document.createElement('td');first.textContent=date.slice(8,10)+'/'+date.slice(5,7);tr.append(first);
      for(const unit of units){const row=maps[unit.id].get(date);
        for(const [value,digits] of [[row?.posts,0],[row?.people,2],[row?.kg,2],[row?.pph,2]]){
          const td=document.createElement('td');td.textContent=fmt(value,digits);tr.append(td);
        }
      }tbody.append(tr);
    }
    if(!dates.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=17;td.textContent='Nenhuma produção no período.';tr.append(td);tbody.append(tr);}
  }
  async function load(){
    const month=monthInput.value;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return;
    const button=document.getElementById('reload');button.disabled=true;feedback.hidden=true;
    document.getElementById('updated').textContent='Carregando…';
    const end=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
    const endDate=month===today.slice(0,7)?today:`${month}-${String(end).padStart(2,'0')}`;
    const requests=[
      get(`dashboard?data_inicio=${month}-01&data_fim=${endDate}`).then(campinas),
      get(`producao/pederneiras/mensal?mes=${month}`).then(other),
      get(`producao/ribeirao/mensal?mes=${month}`).then(other),
      get(`producao/noroeste/mensal?mes=${month}`).then(other)
    ];
    const settled=await Promise.allSettled(requests);
    const result=Object.fromEntries(units.map((unit,index)=>[unit.id,
      settled[index].status==='fulfilled'?{rows:settled[index].value}:{rows:[],error:settled[index].reason?.message || 'Falha de leitura'}]));
    const dates=[...new Set(units.flatMap(unit=>result[unit.id].rows.map(row=>row.data)))].sort();
    renderSummary(result);renderProductionTotals(result);renderCombinedProduction(result,dates);
    renderChart('chart-weight','kg',result,dates);renderChart('chart-posts','pph',result,dates);renderTable(result,dates);
    await loadConcrete(month+'-01',endDate);
    const failed=units.filter(unit=>result[unit.id].error);
    if(failed.length){feedback.hidden=false;feedback.textContent='Não foi possível carregar '+failed.map(unit=>unit.name).join(', ')+'. Confira o acesso e atualize os dados.';}
    document.getElementById('updated').textContent='Atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    button.disabled=false;
  }
  document.getElementById('reload').addEventListener('click',load);
  monthInput.addEventListener('change',load);
  load().catch(error=>{feedback.hidden=false;feedback.textContent=error.message;document.getElementById('reload').disabled=false;});
})();
