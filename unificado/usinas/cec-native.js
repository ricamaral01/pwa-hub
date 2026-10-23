(function(){
  if(new URLSearchParams(location.search).get('area')!=='cec')return;
  const host=document.getElementById('area-nativa-conteudo');if(!host)return;
  const base='/unificado/mapa/api/usina/cec/';
  const queueKey='unificado_cec_campinas_pending_v1';
  const now=new Date(),today=now.toLocaleDateString('en-CA');
  const tabs=[
    ['resultados','Resultado Corpos de Prova','Tabela de resultados de resistência à compressão.'],
    ['relatorio','Relatório CEC','Controle estatístico e desempenho dos traços.'],
    ['analise','Análise CEC','Análise diária e mensal de conformidade.'],
    ['leitura','Leitura de CP','Escanear QR Code e registrar a resistência.'],
    ['dashboard','Dashboard CEC','Indicadores da usina de Campinas.'],
    ['etiquetas','Etiquetas CP','Identificação de corpos de prova registrados.']
  ];
  const E=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!=null)node.textContent=String(value);return node};
  const newId=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
  const btn=(label,fn,ghost=false)=>{const node=E('button','cec-button'+(ghost?' ghost':''),label);node.type='button';node.addEventListener('click',fn);return node};
  const wrap=E('div','cec-wrap'),nav=E('div','cec-nav'),content=E('div','cec-content');
  wrap.append(nav,content);host.append(wrap);
  let selected='resultados',scanner=null;
  function message(value,error=false){const node=content.querySelector('.cec-message');if(node){node.textContent=value;node.classList.toggle('error',error)}}
  function heading(title,description){content.append(E('h3','',title),E('p','',description))}
  function status(){const node=E('p','cec-message','Carregando dados do CEC na VPS nova…');content.append(node);return node}
  function field(label,name,type='text',value=''){
    const box=E('label','cec-field',label),input=E(type==='textarea'?'textarea':'input');input.name=name;if(type!=='textarea')input.type=type;input.value=value;box.append(input);return box
  }
  function fmt(value){if(value==null||value==='')return '—';if(typeof value==='number')return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(value);return String(value)}
  function table(rows,columns){
    if(!rows.length){content.append(E('p','cec-message','Nenhum registro encontrado para o filtro.'));return}
    const scroll=E('div','cec-scroll'),table=E('table'),head=E('thead'),line=E('tr');
    columns.forEach(([label])=>line.append(E('th','',label)));head.append(line);table.append(head);
    const body=E('tbody');for(const row of rows){const tr=E('tr');for(const [,key] of columns){const td=E('td');if(key==='status_resultado'){const badge=E('span','cec-status '+(row[key]==='OK'?'ok':row[key]==='NOK'?'nok':''),fmt(row[key]));td.append(badge)}else td.textContent=fmt(row[key]);tr.append(td)}body.append(tr)}table.append(body);scroll.append(table);content.append(scroll)
  }
  function kpis(items){const grid=E('div','cec-kpis');for(const [label,value] of items){const card=E('div','cec-kpi');card.append(E('span','',label),E('strong','',fmt(value)));grid.append(card)}content.append(grid)}
  function dateFilters(load){
    const form=E('form','cec-filters');const month=field('Mês','mes','number',String(now.getMonth()+1)),year=field('Ano','ano','number',String(now.getFullYear()));
    month.querySelector('input').min='1';month.querySelector('input').max='12';year.querySelector('input').min='2020';year.querySelector('input').max='2040';
    const submit=E('button','cec-button','Filtrar');submit.type='submit';form.append(month,year,submit);
    form.addEventListener('submit',event=>{event.preventDefault();load({mes:month.querySelector('input').value,ano:year.querySelector('input').value})});content.append(form);
    return {mes:month.querySelector('input').value,ano:year.querySelector('input').value}
  }
  async function get(path,params={}){
    const query=new URLSearchParams(params),url=base+path+(query.size?'?'+query:'');
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store'}),data=await response.json();
    if(!response.ok)throw new Error(data.error?.message||data.error||`Consulta CEC falhou (${response.status}).`);
    return data
  }
  const groupCols=[['Moldagem','data_moldagem'],['Traço','traco_id'],['Idade (dias)','idade_dias'],['CP 1 (MPa)','mpa_cp1'],['CP 2 (MPa)','mpa_cp2'],['Média (MPa)','media_mpa'],['Resultado','status_resultado']];
  const statsCols=[['Período','ano_mes'],['Traço','traco_id'],['Idade','idade_dias'],['Grupos','quantidade_grupos'],['CPs','quantidade_corpos_prova'],['OK','quantidade_ok'],['NOK','quantidade_nok'],['AMP','quantidade_amp'],['Média (MPa)','media_mpa'],['Desvio','desvio_padrao']];
  async function results(mode){
    heading(mode==='relatorio'?'Relatório CEC':'Resultado Corpos de Prova',mode==='relatorio'?'Resistência, metas e conformidade por grupo de CP.':'Consulte os resultados por mês e ano.');
    const load=async filters=>{
      content.querySelectorAll('.cec-kpis,.cec-scroll,.cec-message,.cec-bar-row').forEach(n=>n.remove());status();
      try{const data=await get('resultados',{...filters,limit:5000}),rows=data.rows||[];
        message(`${rows.length} grupo(s) consultado(s) na VPS nova.`);
        const done=rows.filter(r=>r.status_resultado!=='PEND'),ok=done.filter(r=>r.status_resultado==='OK').length;
        if(mode==='relatorio')kpis([['Grupos',rows.length],['Conformes',ok],['Abaixo da meta',done.filter(r=>r.status_resultado==='NOK').length],['Acima da meta',done.filter(r=>r.status_resultado==='AMP').length],['Conformidade',done.length?`${Math.round(ok/done.length*100)}%`:'—']]);
        table(rows,groupCols);
      }catch(error){message(error.message,true)}
    };
    const filters=dateFilters(load);load(filters)
  }
  async function analysis(mode){
    const dashboard=mode==='dashboard';heading(dashboard?'Dashboard CEC':'Análise CEC','Estatísticas calculadas na VPS nova a partir dos rompimentos de Campinas.');
    const load=async filters=>{
      content.querySelectorAll('.cec-kpis,.cec-scroll,.cec-message,.cec-bar-row').forEach(n=>n.remove());status();
      try{const data=await get('estatistica-mensal',filters),rows=data.rows||[];
        message(`${rows.length} resultado(s) mensais.`);
        const total=rows.reduce((sum,row)=>sum+Number(row.quantidade_grupos||0),0),ok=rows.reduce((sum,row)=>sum+Number(row.quantidade_ok||0),0),nok=rows.reduce((sum,row)=>sum+Number(row.quantidade_nok||0),0),amp=rows.reduce((sum,row)=>sum+Number(row.quantidade_amp||0),0),cp=rows.reduce((sum,row)=>sum+Number(row.quantidade_corpos_prova||0),0);
        kpis([['Grupos',total],['Corpos de prova',cp],['Conformes',ok],['Abaixo da meta',nok],['Acima da meta',amp]]);
        if(dashboard){const max=Math.max(1,...rows.map(r=>Number(r.quantidade_grupos||0)));for(const row of rows.slice(0,12)){const bar=E('div','cec-bar-row');bar.append(E('span','',`${row.traco_id} · ${row.idade_dias}d`));const track=E('span','cec-bar'),fill=E('i');fill.style.width=`${Math.max(2,Number(row.quantidade_grupos||0)/max*100)}%`;track.append(fill);bar.append(track,E('strong','',fmt(row.quantidade_grupos)));content.append(bar)}}
        table(rows,statsCols);
      }catch(error){message(error.message,true)}
    };
    const filters=dateFilters(load);load(filters)
  }
  function parseQR(raw){const value={};for(const part of raw.split('|')){const i=part.indexOf('=');if(i>0)value[part.slice(0,i).trim().toLowerCase()]=part.slice(i+1).trim()}return value}
  function queue(){try{return JSON.parse(localStorage.getItem(queueKey)||'[]')}catch{return []}}
  function saveQueue(items){localStorage.setItem(queueKey,JSON.stringify(items))}
  async function syncQueue(){
    const items=queue();if(!items.length||!navigator.onLine)return;
    const pending=[];for(const item of items){try{const response=await fetch(base+'leituras',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});if(!response.ok)pending.push(item)}catch{pending.push(item)}}
    saveQueue(pending);const badge=content.querySelector('[data-pending]');if(badge)badge.textContent=String(pending.length)
  }
  async function reader(){
    heading('Leitura de CP','Escaneie a etiqueta ou cole o QR e informe a resistência em MPa.');
    const layout=E('div','cec-reader'),left=E('div'),right=E('div');
    const camera=E('div','cec-camera');camera.id='cec-camera';left.append(camera,E('p','cec-camera-note','A câmera requer permissão do navegador. Também é possível colar o QR manualmente.'));
    const start=btn('Iniciar câmera',async()=>{if(scanner){await stopCamera();return}try{if(!window.Html5Qrcode)throw new Error('Leitor de câmera indisponível.');scanner=new Html5Qrcode('cec-camera');await scanner.start({facingMode:'environment'},{fps:10,qrbox:250},async text=>{qr.querySelector('textarea').value=text;showQR();await stopCamera()},()=>{});start.textContent='Parar câmera'}catch(error){message(error.message,true)}});
    async function stopCamera(){if(scanner){await scanner.stop().catch(()=>{});scanner.clear();scanner=null}start.textContent='Iniciar câmera'}
    left.append(start);
    const qr=field('QR da etiqueta','qr_raw','textarea'),mpa=field('Resistência (MPa)','resistencia_mpa','number',''),details=E('p','cec-camera-note','Informe o QR para visualizar os campos.');
    mpa.querySelector('input').step='0.01';mpa.querySelector('input').min='0.01';mpa.querySelector('input').max='150';
    function showQR(){const p=parseQR(qr.querySelector('textarea').value);details.textContent=`Traço: ${p.traco||'—'} · CP: ${p.cp||'—'} · Idade: ${p.idade||'—'} dias · Moldagem: ${p.mold||'—'}`}
    qr.querySelector('textarea').addEventListener('input',showQR);right.append(qr,details,mpa);
    const actions=E('div','cec-filters cec-reader-actions'),save=btn('Salvar leitura',async()=>{
      const raw=qr.querySelector('textarea').value.trim(),value=Number(mpa.querySelector('input').value);
      if(!raw||!Number.isFinite(value)||value<=0){message('Informe o QR e um valor MPa válido.',true);return}
      const payload={id:newId(),qr_raw:raw,resistencia_mpa:value,timestamp:new Date().toISOString()};save.disabled=true;
      try{const response=await fetch(base+'leituras',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok){if(response.status===401||response.status>=500){saveQueue([...queue(),payload]);message('Leitura preservada na fila. Ela será enviada quando a sessão e a conexão estiverem disponíveis.',true)}else message(data.error||'Leitura rejeitada.',true);return}message(`Leitura salva na VPS nova. ID ${data.record?.id||payload.id}`);qr.querySelector('textarea').value='';mpa.querySelector('input').value='';details.textContent='Informe o QR para visualizar os campos.'}catch{saveQueue([...queue(),payload]);message('Sem conexão. Leitura preservada na fila.',true)}finally{save.disabled=false;const badge=content.querySelector('[data-pending]');if(badge)badge.textContent=String(queue().length)}
    });
    actions.append(save,btn('Enviar pendentes',syncQueue,true),E('span','',`Pendentes: `));const pending=E('strong','',String(queue().length));pending.dataset.pending='';actions.append(pending);right.append(actions);layout.append(left,right);content.append(layout);status();message('As leituras são gravadas no banco CEC da VPS nova.');syncQueue()
  }
  async function labels(){
    heading('Etiquetas CP','Etiquetas dos corpos de prova que já possuem leitura registrada.');
    status();try{const data=await get('leituras',{limit:200}),rows=data.rows||[],grid=E('div','cec-labels');message(`${rows.length} leitura(s) disponíveis para impressão.`);
      for(const row of rows){const label=E('div','cec-label');label.append(E('strong','',`${row.traco_id} · CP ${row.cp}`),E('span','',`Idade ${row.idade_dias} dias · Moldagem ${fmt(row.data_moldagem)}`),E('span','',`ID ${row.id} · ${fmt(row.mpa)} MPa`));grid.append(label)}content.append(btn('Imprimir etiquetas',()=>window.print(),true),grid)
    }catch(error){message(error.message,true)}
  }
  function select(id){selected=id;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.id===id)));content.replaceChildren();if(scanner){scanner.stop().catch(()=>{});scanner.clear();scanner=null}
    if(id==='resultados'||id==='relatorio')results(id);else if(id==='analise'||id==='dashboard')analysis(id);else if(id==='leitura')reader();else labels()
  }
  for(const [id,title,description] of tabs){const card=E('button');card.type='button';card.dataset.id=id;const copy=E('span');copy.append(E('strong','',title),E('small','',description));card.append(copy);card.addEventListener('click',()=>select(id));nav.append(card)}
  window.addEventListener('online',syncQueue);select('resultados');
})();
