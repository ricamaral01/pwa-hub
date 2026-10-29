(() => {
  const units = [
    {id:'campinas', name:'Campinas', color:'#ef8737'},
    {id:'pederneiras', name:'Pederneiras', color:'#238ac0'},
    {id:'ribeirao', name:'Ribeirão', color:'#4aab78'}
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
    if(!dates.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=13;td.textContent='Nenhuma produção no período.';tr.append(td);tbody.append(tr);}
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
      get(`producao/ribeirao/mensal?mes=${month}`).then(other)
    ];
    const settled=await Promise.allSettled(requests);
    const result=Object.fromEntries(units.map((unit,index)=>[unit.id,
      settled[index].status==='fulfilled'?{rows:settled[index].value}:{rows:[],error:settled[index].reason?.message || 'Falha de leitura'}]));
    const dates=[...new Set(units.flatMap(unit=>result[unit.id].rows.map(row=>row.data)))].sort();
    renderSummary(result);renderChart('chart-weight','kg',result,dates);renderChart('chart-posts','pph',result,dates);renderTable(result,dates);
    const failed=units.filter(unit=>result[unit.id].error);
    if(failed.length){feedback.hidden=false;feedback.textContent='Não foi possível carregar '+failed.map(unit=>unit.name).join(', ')+'. Confira o acesso e atualize os dados.';}
    document.getElementById('updated').textContent='Atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    button.disabled=false;
  }
  document.getElementById('reload').addEventListener('click',load);
  monthInput.addEventListener('change',load);
  load().catch(error=>{feedback.hidden=false;feedback.textContent=error.message;document.getElementById('reload').disabled=false;});
})();
