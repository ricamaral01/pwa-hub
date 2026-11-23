/* Armature demand is derived on the server. Only the working calendar is editable. */
(() => {
  const user = requireAuth();
  if (!user) return;
  const reportPage = location.pathname.includes('armaduras-relatorio');
  initSidebar(reportPage ? 'armaduras-relatorio' : 'armaduras');
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = {view: reportPage ? 'relatorio' : 'semana', preview:null, calendar:null, sequence:0, busy:false};
  const canEdit = ['ADMIN','PCP'].includes(user.nivel_acesso);
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const date = value => new Date(value+'T12:00:00Z');
  const iso = value => value.toISOString().slice(0,10);
  const monday = value => {const d=date(value);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return iso(d);};
  const label = value => new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(date(value));
  const dayLabel = value => new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(date(value));
  const groupLabel = group => group==='12'?'Setor 1 e 2':'Setor 3 e 4';
  const number = value => value===null?'—':Number(value).toLocaleString('pt-BR',{maximumFractionDigits:2});
  const params = new URLSearchParams(location.search);
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(params.get('semana')||'') ? params.get('semana') : today;
  $('week').value=monday(initial);$('arm-day').value=today;$('calendar-year').value=initial.slice(0,4);
  if (['12','34'].includes(params.get('grupo'))) $('group').value=params.get('grupo');
  async function request(path, options={}) {
    const response=await fetch('/unificado/pcp/api/armaduras'+path,{
      cache:'no-store',...options,headers:{Authorization:'Bearer '+API.getToken(),'Content-Type':'application/json',
        'X-Unificado-Screen':reportPage?'armadurasRelatorio':'armadurasProgramacao',...options.headers}});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(typeof data.detail==='string'?data.detail:'Não foi possível concluir a consulta de armaduras.');}
    return response;
  }
  async function json(path,options){return(await request(path,options)).json();}
  function error(message){$('error').hidden=!message;$('error').textContent=message||'';}
  function filters(){return new URLSearchParams({semana:$('week').value,grupo:$('group').value});}
  function table(data,paper=false){
    const days=data.dias;
    let html='<table class="ar-table ar-grid"><thead><tr><th>Descrição do poste</th><th>Cód. produto</th><th>Peso poste<br>(kg)</th>'+days.map(d=>'<th>Poste<br>'+escape(dayLabel(d.poste))+'</th>').join('')+'<th>Total<br>(un.)</th></tr><tr class="ar-d1"><th colspan="3">Produzir armadura em →</th>'+days.map(d=>'<th>'+escape(dayLabel(d.armadura))+'</th>').join('')+'<th>un.</th></tr></thead><tbody>';
    for(const sector of [...new Set(data.linhas.map(r=>r.setor))]){
      const selected=data.linhas.filter(r=>r.setor===sector);
      html+='<tr class="ar-sector"><td colspan="'+(4+days.length)+'">Setor '+sector+'</td></tr>';
      for(const row of selected)html+='<tr><td>'+escape(row.descricao)+'</td><td>'+escape(row.codigo||'Sem código')+'</td><td>'+number(row.peso_poste_kg)+'</td>'+days.map(d=>'<td>'+number(row.dias[d.poste]||0)+'</td>').join('')+'<td>'+number(row.total)+'</td></tr>';
      html+='<tr class="ar-total"><td colspan="3">Subtotal setor '+sector+'</td>'+days.map(d=>'<td>'+number(selected.reduce((s,r)=>s+r.dias[d.poste],0))+'</td>').join('')+'<td>'+number(selected.reduce((s,r)=>s+r.total,0))+'</td></tr>';
    }
    html+='<tr class="ar-total"><td colspan="3">Total de armaduras</td>'+days.map(d=>'<td>'+number(data.totais[d.poste])+'</td>').join('')+'<td>'+number(data.total)+'</td></tr></tbody></table>';
    const dates=Object.keys(data.totais_armadura);
    const summary='<div class="ar-summary"><div><span class="ar-muted">Armaduras programadas</span><strong>'+number(data.total)+' un.</strong></div><div><span class="ar-muted">Período das armaduras</span><strong>'+label(dates[0])+' a '+label(dates[dates.length-1])+'</strong></div></div>';
    const paperHeader='<div class="ar-paper-header"><strong>CONCREFER</strong><div><strong>Programação de produção de armaduras</strong>'+groupLabel(data.grupo)+' · Campinas<br>Postes: '+label(data.inicio)+' a '+label(data.fim)+'</div><div>Prévia para emissão<br>Revisão da origem: '+escape(data.revisoes_origem.join(', ')||'Por forma')+'</div></div>';
    return '<section class="ar-panel'+(paper?' ar-paper':'')+'"><div class="ar-panelhead"><div><h2>'+groupLabel(data.grupo)+'</h2><p class="ar-muted">'+escape(data.fonte)+' · uma armadura por poste</p></div><span class="ar-badge">D-1 útil</span></div>'+summary+(data.pendencias.length?'<div class="ar-notice">'+data.pendencias.map(escape).join('<br>')+'</div>':'')+'<div class="ar-scroll">'+(paper?paperHeader:'')+html+'</div>'+(data.total?'':'<p class="ar-empty">Nenhuma armadura programada para este período.</p>')+'<p class="ar-muted" style="margin-top:12px">Peso do poste não corresponde ao peso do aço. As quantidades são alteradas na programação de origem.</p></section>';
  }
  async function history(sequence){
    const records=await json('/emissoes?'+filters());
    if(sequence!==state.sequence)return;
    $('history').innerHTML=records.length?records.map(r=>'<tr><td>'+r.id+'</td><td>'+r.revisao+'</td><td>'+escape(new Date(r.criado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))+'</td><td>'+escape(r.responsavel)+'</td><td>'+(r.atual?'Atual':'Programação/calendário alterado')+'</td><td><button type="button" class="ar-button" data-download="'+r.id+'">Baixar / reimprimir</button></td></tr>').join(''):'<tr><td colspan="6">Nenhum relatório emitido para esta semana e grupo.</td></tr>';
  }
  async function load(){
    const sequence=++state.sequence;state.preview=null;state.busy=true;error('');$('issue').disabled=true;$('results').setAttribute('aria-busy','true');$('status').textContent='Consultando programação e calendário…';
    try{
      if(!$('week').value||!$('arm-day').value)throw new Error('Informe uma data válida.');
      const qs=filters();
      if(state.view==='relatorio'){
        const data=await json('/relatorio?'+qs);if(sequence!==state.sequence)return;
        state.preview=data;$('results').innerHTML=data.grupos.map(g=>table(g,true)).join('');
        await history(sequence);
      }else{
        if(state.view==='dia')qs.set('data_armadura',$('arm-day').value);
        const data=await json('/programacao?'+qs);if(sequence!==state.sequence)return;
        $('results').innerHTML=(state.view==='dia'?'<section class="ar-rule"><strong>'+escape(dayLabel($('arm-day').value))+'</strong><span>Produzir '+number(data.total)+' armaduras para atender postes de '+label(data.inicio)+' a '+label(data.fim)+'.</span></section>':'')+table(data);
      }
      if(sequence===state.sequence)$('status').textContent='Consulta atualizada. Regra: último dia de trabalho anterior.';
    }catch(e){if(sequence===state.sequence){error(e.message);$('results').replaceChildren();$('history').replaceChildren();$('status').textContent='Consulta não concluída.';}}
    finally{if(sequence===state.sequence){state.busy=false;$('results').setAttribute('aria-busy','false');$('issue').disabled=!state.preview||Boolean(state.preview.pendencias.length)||!state.preview.grupos.some(g=>g.total>0);}}
  }
  function view(value){
    state.view=value;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===value)));
    $('week-label').hidden=value==='dia';$('day-label').hidden=value!=='dia';$('issue').hidden=value!=='relatorio';$('history-section').hidden=value!=='relatorio';
    $('group').querySelector('[value="todos"]').hidden=value!=='relatorio';if(value!=='relatorio'&&$('group').value==='todos')$('group').value='12';
    load();
  }
  async function download(id){const response=await request('/emissoes/'+id+'/pdf');const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download='armaduras-emissao-'+id+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  $('issue').onclick=async()=>{
    if(!state.preview||state.busy)return;const snapshot=state.preview;
    $('issue').disabled=true;state.busy=true;error('');
    try{const emission=await json('/emissoes',{method:'POST',body:JSON.stringify({semana:$('week').value,grupo:$('group').value,assinatura:snapshot.assinatura})});await download(emission.id);$('status').textContent='PDF emitido. Abra o arquivo para imprimir.';await history(state.sequence);}
    catch(e){error(e.message);state.preview=null;}
    finally{state.busy=false;$('issue').disabled=!state.preview;}
  };
  $('history').onclick=async e=>{const button=e.target.closest('[data-download]');if(!button)return;button.disabled=true;try{await download(button.dataset.download);}catch(err){error(err.message);}finally{button.disabled=false;}};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
  $('refresh').onclick=load;$('group').onchange=load;$('arm-day').onchange=load;$('week').onchange=()=>{if($('week').value)$('week').value=monday($('week').value);load();};
  function calendarRender(){
    const config=state.calendar;
    $('calendar-meta').textContent='Revisão '+config.revisao+' · feriados nacionais, estaduais e municipais cadastrados de 2025 a 2030. Pontos facultativos não são fechados automaticamente.';
    $('weekdays').innerHTML=['Seg','Ter','Qua','Qui','Sex','Sáb'].map((name,index)=>'<label><input type="checkbox" value="'+index+'" '+(config.dias_semana.includes(index)?'checked ':'')+(!canEdit?'disabled':'')+'>'+name+'</label>').join('');
    const year=$('calendar-year').value;
    $('calendar-exceptions').innerHTML=config.excecoes.filter(r=>r.data.startsWith(year+'-')).map(r=>'<tr><td>'+label(r.data)+'</td><td>'+(r.trabalha?'Com trabalho':'Sem trabalho')+'</td><td>'+escape(r.motivo)+'</td><td>'+(canEdit?'<button type="button" class="ar-button" data-edit-day="'+r.data+'">Ajustar</button>':'—')+'</td></tr>').join('');
    $('calendar-save').hidden=!canEdit;$('exception-form').hidden=!canEdit;
  }
  $('calendar-open').onclick=async()=>{try{state.calendar=await json('/calendario');calendarRender();$('calendar-dialog').showModal();}catch(e){error(e.message);}};
  $('calendar-close').onclick=()=>{$('calendar-dialog').close();load();};$('calendar-dialog').addEventListener('cancel',()=>load());
  $('calendar-year').oninput=()=>calendarRender();
  $('calendar-exceptions').onclick=e=>{const button=e.target.closest('[data-edit-day]');if(!button)return;const row=state.calendar.excecoes.find(r=>r.data===button.dataset.editDay);$('exception-day').value=row.data;$('exception-open').value=String(row.trabalha);$('exception-reason').value=row.motivo;$('exception-day').focus();};
  async function calendarSave(path,body,button){button.disabled=true;$('calendar-error').textContent='';try{state.calendar=await json(path,{method:'PUT',body:JSON.stringify({...body,revisao:state.calendar.revisao})});calendarRender();}catch(e){$('calendar-error').textContent=e.message;}finally{button.disabled=false;}}
  $('calendar-form').onsubmit=e=>{e.preventDefault();calendarSave('/calendario',{dias_semana:[...$('weekdays').querySelectorAll('input:checked')].map(i=>Number(i.value)),confirmado:true},$('calendar-save'));};
  $('exception-form').onsubmit=e=>{e.preventDefault();calendarSave('/calendario/dias/'+$('exception-day').value,{trabalha:$('exception-open').value==='true',motivo:$('exception-reason').value},$('exception-save'));};
  view(state.view);
})();
