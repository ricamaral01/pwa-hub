const DB_NAME = 'noro-cec-offline-v1';
const STORE = 'pendentes';
let activeOnlineHandler;

const element = (tag, value, className) => {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
};

function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE))
        req.result.createObjectStore(STORE, {keyPath:'local_id'});
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueOp(mode, method, argument) {
  const db = await openQueue();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = argument === undefined ? tx.objectStore(STORE)[method]() :
        tx.objectStore(STORE)[method](argument);
      let result;
      req.onsuccess = () => { result = req.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || req.error);
      tx.onabort = () => reject(tx.error || new Error('Fila indisponível'));
    });
  } finally { db.close(); }
}

function dateFromQR(value) {
  if (!/^\d{2}-\d{2}-\d{2}$/.test(value || '')) return '';
  const [day, month, year] = value.split('-');
  return `${Number(year) < 80 ? '20' : '19'}${year}-${month}-${day}`;
}

function field(label, type='text', required=false) {
  const wrap=element('label',label,'noro-cec-field');
  const input=element('input');input.type=type;input.required=required;
  wrap.append(input);return [wrap,input];
}

function renderTable(rows, onDelete, api) {
  const wrap=element('div',undefined,'noro-table-wrap');
  const table=element('table');const head=element('tr');
  for(const name of ['Registro','Traço','Série','CP','Idade','Moldagem','Ruptura','MPa','Fonte','Ações'])
    head.append(element('th',name));
  const thead=element('thead');thead.append(head);table.append(thead);
  const body=element('tbody');
  for(const row of rows) {
    const tr=element('tr');
    const values=[String(row.created_at||'').slice(0,16).replace('T',' '),row.traco,
      row.numero_serie,row.cp,row.idade,row.data_moldagem,row.data_ruptura,
      row.resistencia_mpa,row.fonte_tabela==='unificado'?'Unificado':'Legado'];
    for(const value of values) tr.append(element('td',value ?? '—'));
    const action=element('td');
    if(row.fonte_tabela==='unificado' && row.local_id){
      const pdf=element('a','Etiqueta PDF','noro-link-button');
      pdf.href=`${api}/cec/etiqueta/${encodeURIComponent(row.local_id)}.pdf`;
      pdf.target='_blank';pdf.rel='noopener';
      const remove=element('button','Excluir','noro-link-button');remove.type='button';
      remove.addEventListener('click',()=>onDelete(row));
      action.append(pdf,' ',remove);
    }
    tr.append(action);
    body.append(tr);
  }
  if(!rows.length){const tr=element('tr');const td=element('td','Nenhuma leitura registrada');td.colSpan=10;tr.append(td);body.append(tr)}
  table.append(body);wrap.append(table);return wrap;
}

export async function mountCec(container, api) {
  if (activeOnlineHandler) window.removeEventListener('online', activeOnlineHandler);
  const title=element('h2','Leituras de corpos de prova','noro-section-title');
  const notice=element('p','Registros novos ficam no Unificado. O aplicativo antigo continua oficial durante o paralelo.','noro-note');
  const status=element('p','', 'noro-note');
  const cards=element('div',undefined,'noro-grid');
  const list=element('div');
  container.append(notice,title,cards,status,list);

  const analysisTitle=element('h2','Análise descritiva por traço e idade','noro-section-title');
  const analysisForm=element('form',undefined,'noro-filters');
  const [traceWrap,traceInput]=field('Traço');
  const [ageWrap,ageInput]=field('Idade (dias)','number');ageInput.min='1';ageInput.max='3650';
  const analyse=element('button','Filtrar análise');analyse.type='submit';
  analysisForm.append(traceWrap,ageWrap,analyse);
  const analysisNote=element('p','Estatística descritiva. Critério de aceitação ainda não configurado.','noro-note');
  const analysisResult=element('div');
  container.append(analysisTitle,analysisForm,analysisNote,analysisResult);

  const formTitle=element('h2','Nova leitura','noro-section-title');
  const form=element('form',undefined,'noro-cec-form');
  const fields={};
  const specs=[['qr_raw','QR da etiqueta','text',false],['traco','Traço','text',true],
    ['numero_serie','Número de série','text',false],['nome','Tipo / nome','text',false],
    ['cp','CP','text',false],['idade','Idade (dias)','number',false],
    ['data_moldagem','Data de moldagem','date',false],['hora_moldagem','Hora de moldagem','time',false],
    ['data_ruptura','Data de ruptura','date',false],['resistencia_mpa','Resistência (MPa)','number',true]];
  for(const [key,label,type,required] of specs){
    const [wrap,input]=field(label,type,required);input.name=key;
    if(key==='resistencia_mpa'){input.min='0.01';input.step='0.01'}
    if(key==='idade'){input.min='1';input.max='3650'}
    fields[key]=input;form.append(wrap);
  }
  const actions=element('div',undefined,'noro-cec-actions');
  const save=element('button','Guardar leitura');save.type='submit';
  const labelButton=element('button','Gerar etiqueta PDF');labelButton.type='button';
  const resend=element('button','Reenviar pendências');resend.type='button';
  actions.append(save,labelButton,resend);form.append(actions);
  const feedback=element('p','', 'noro-note');
  container.append(formTitle,form,feedback);

  fields.qr_raw.addEventListener('change',()=>{
    const parts={};
    for(const segment of fields.qr_raw.value.split('|')){
      const separator=segment.indexOf('=');
      if(separator>0)parts[segment.slice(0,separator).trim().toLowerCase()]=segment.slice(separator+1).trim();
    }
    for(const [key,target] of [['traco','traco'],['ns','numero_serie'],['nome','nome'],
      ['cp','cp'],['idade','idade'],['hora','hora_moldagem']])
      if(parts[key] && !fields[target].value)fields[target].value=parts[key];
    if(parts.mold && !fields.data_moldagem.value)fields.data_moldagem.value=dateFromQR(parts.mold);
    if(parts.rupt && !fields.data_ruptura.value)fields.data_ruptura.value=dateFromQR(parts.rupt);
  });

  async function pendingCount(){
    const rows=await queueOp('readonly','getAll');
    status.textContent=`Fila offline: ${rows.length} pendência(s). ${navigator.onLine?'Conectado':'Sem conexão'}.`;
    return rows;
  }
  async function refresh(){
    try{
      const response=await fetch(api+'/cec/leituras?limit=500',{credentials:'same-origin',cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
      const box=(name,value)=>{const node=element('div',undefined,'noro-card');node.append(
        element('span',name,'noro-card-label'),element('strong',value,'noro-card-value'));return node};
      cards.replaceChildren(box('Leituras',data.total),box('Média',data.resumo.media??'—'),
        box('Mínimo',data.resumo.minimo??'—'),box('Máximo',data.resumo.maximo??'—'),
        box('Traços',data.resumo.tracos));
      list.replaceChildren(renderTable(data.rows,removeLocal,api));
    }catch(error){list.replaceChildren(element('p',error.message,'noro-error'))}
    await pendingCount();
    await loadAnalysis();
  }
  async function loadAnalysis(){
    try{
      const query=new URLSearchParams();
      if(traceInput.value.trim())query.set('traco',traceInput.value.trim());
      if(ageInput.value)query.set('idade',ageInput.value);
      const response=await fetch(api+'/cec/analise?'+query,{credentials:'same-origin',cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
      analysisResult.replaceChildren(renderAnalysis(data.grupos));
    }catch(error){analysisResult.replaceChildren(element('p',error.message,'noro-error'))}
  }
  function renderAnalysis(groups){
    const wrap=element('div',undefined,'noro-table-wrap');const table=element('table');
    const head=element('tr');
    for(const name of ['Traço','Idade','N','Média MPa','Mínimo','Máximo','Desvio amostral','CV %'])head.append(element('th',name));
    const thead=element('thead');thead.append(head);table.append(thead);
    const body=element('tbody');
    for(const group of groups){
      const tr=element('tr');
      for(const value of [group.traco,group.idade,group.n,group.media,group.minimo,group.maximo,
        group.desvio_amostral,group.cv_percentual])tr.append(element('td',value??'—'));
      body.append(tr);
    }
    if(!groups.length){const tr=element('tr');const td=element('td','Nenhum resultado para o filtro');td.colSpan=8;tr.append(td);body.append(tr)}
    table.append(body);wrap.append(table);return wrap;
  }
  async function removeLocal(row){
    if(!window.confirm(`Excluir a leitura local ${row.traco||''} / ${row.cp||''}?`))return;
    try{
      const response=await fetch(`${api}/cec/leituras/${encodeURIComponent(row.local_id)}`,
        {method:'DELETE',credentials:'same-origin'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
      feedback.textContent='Leitura local excluída.';
      await refresh();
    }catch(error){feedback.textContent=`Falha ao excluir: ${error.message}`}
  }
  analysisForm.addEventListener('submit',event=>{event.preventDefault();loadAnalysis()});
  let syncing=false;
  async function flush(){
    if(syncing)return;
    syncing=true;resend.disabled=true;
    try{
      for(const item of await pendingCount()){
        let response;
        try{
          response=await fetch(api+'/cec/leituras',{method:'POST',credentials:'same-origin',
            headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
        }catch(error){feedback.textContent='Sem conexão. A leitura permanece na fila.';break}
        if(!response.ok){
          const data=await response.json().catch(()=>({}));
          feedback.textContent=`Envio pendente: ${data.error||response.status}`;break;
        }
        await queueOp('readwrite','delete',item.local_id);
        feedback.textContent='Leitura enviada ao Unificado.';
      }
      if (navigator.onLine) await refresh();
      else await pendingCount();
    }finally{syncing=false;resend.disabled=false}
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const payload={local_id:crypto.randomUUID()};
    for(const [key] of specs)payload[key]=fields[key].value.trim()||null;
    payload.idade=payload.idade?Number(payload.idade):null;
    payload.resistencia_mpa=Number(payload.resistencia_mpa);
    if(!payload.traco || !Number.isFinite(payload.resistencia_mpa) || payload.resistencia_mpa<=0){
      feedback.textContent='Informe traço e resistência válida.';return;
    }
    try{
      await queueOp('readwrite','put',payload);
      form.reset();feedback.textContent='Leitura guardada na fila local.';
      await flush();
    }catch(error){feedback.textContent=`Não foi possível guardar a leitura: ${error.message}`}
  });
  labelButton.addEventListener('click',async()=>{
    const payload={};
    for(const [key] of specs){
      if(key==='resistencia_mpa')continue;
      payload[key]=fields[key].value.trim()||null;
    }
    payload.idade=payload.idade?Number(payload.idade):null;
    if(!payload.traco){feedback.textContent='Informe o traço para gerar a etiqueta.';return}
    try{
      const response=await fetch(api+'/cec/etiqueta.pdf',{method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!response.ok){const detail=await response.json().catch(()=>({}));throw new Error(detail.error||`HTTP ${response.status}`)}
      const url=URL.createObjectURL(await response.blob());
      const link=element('a');link.href=url;link.download='noro-cp-etiqueta.pdf';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      feedback.textContent='Etiqueta PDF gerada sem registrar uma leitura.';
    }catch(error){feedback.textContent=`Falha ao gerar etiqueta: ${error.message}`}
  });
  resend.addEventListener('click',flush);
  activeOnlineHandler=flush;window.addEventListener('online',activeOnlineHandler);
  await refresh();
  if(navigator.onLine)await flush();
}
