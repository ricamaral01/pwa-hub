/* Read-only external reports. The existing proxy checks availability before embedding. */
(() => {
  const dateInput=document.getElementById('date');
  const frame=document.getElementById('report');
  const source=document.getElementById('source');
  const status=document.getElementById('status');
  const feedback=document.getElementById('report-feedback');
  const message=document.getElementById('report-message');
  const retry=document.getElementById('report-retry');
  const originalBase='https://dautomacao.com/concretrack/relatorios/reports-diarios/generated/pcp-producao/';
  const api='/unificado/mapa/api/usina/reporting/pcp-producao/';
  const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'');
  const display=value=>value.split('-').reverse().join('/');
  let available=[],generation=0,request=null,timer=null;
  function state(text,canRetry=false){
    frame.hidden=true;source.hidden=true;status.hidden=true;
    feedback.hidden=false;message.textContent=text;retry.hidden=!canRetry;
    if(canRetry&&!available.length){dateInput.replaceChildren(new Option('Lista indisponível',''));}
  }
  function cancel(){
    ++generation;request?.abort();clearTimeout(timer);timer=null;
    frame.onload=null;frame.onerror=null;
    return generation;
  }
  async function openReport(value){
    if(!valid(value))return;
    const ticket=cancel();request=new AbortController();
    dateInput.value=value;
    const current=new URL(location.href);current.searchParams.set('data',value);history.replaceState(null,'',current);
    state(`Carregando relatório de ${display(value)}…`);
    timer=setTimeout(()=>{if(ticket===generation){request.abort();state('Não foi possível carregar o relatório. Tente novamente.',true);}},20000);
    try{
      const response=await fetch(api+'report/'+value,{method:'GET',credentials:'same-origin',cache:'no-store',signal:request.signal});
      if(ticket!==generation)return;
      if(response.status===404){clearTimeout(timer);state('Não há relatório disponível para esta data. Selecione outra data ou tente novamente.',true);return;}
      if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('unavailable');
      const url=originalBase+`relatorio_pcp_producao_${value}.html`;
      // Check browser reachability too: iframe load alone also fires for network error pages.
      await fetch(url,{method:'GET',mode:'no-cors',credentials:'omit',cache:'no-store',signal:request.signal});
      if(ticket!==generation)return;
      frame.onload=()=>{
        if(ticket!==generation)return;
        clearTimeout(timer);feedback.hidden=true;frame.hidden=false;source.hidden=false;status.hidden=false;
        frame.style.visibility='';
        source.href=url;
        status.textContent=`Relatório de ${display(value)} · PCP x Produção + Qualidade de Ribeirão`;
        frame.setAttribute('aria-busy','false');
      };
      frame.onerror=()=>{if(ticket===generation){clearTimeout(timer);state('Não foi possível abrir o relatório da origem. Tente novamente.',true);}};
      frame.hidden=false;frame.style.visibility='hidden';frame.setAttribute('aria-busy','true');frame.src=url;
    }catch{
      if(ticket!==generation)return;
      clearTimeout(timer);state('Não foi possível carregar o relatório. Tente novamente.',true);
    }
  }
  async function loadManifest(){
    const ticket=cancel();request=new AbortController();available=[];dateInput.disabled=true;
    state('Carregando os relatórios disponíveis…');
    timer=setTimeout(()=>{if(ticket===generation){request.abort();state('Não foi possível carregar a lista de relatórios. Tente novamente.',true);}},20000);
    try{
      const response=await fetch(api+'manifest',{method:'GET',credentials:'same-origin',cache:'no-store',signal:request.signal});
      if(!response.ok)throw Error('unavailable');
      const payload=await response.json();if(ticket!==generation)return;
      clearTimeout(timer);available=Array.isArray(payload.reports)?[...new Set(payload.reports.filter(valid))].sort().reverse():[];
      if(!available.length){state('Nenhum relatório está disponível na origem.',true);return;}
      dateInput.replaceChildren(...available.map(value=>{const option=document.createElement('option');option.value=value;option.textContent=display(value);return option;}));
      dateInput.disabled=false;
      const requested=new URLSearchParams(location.search).get('data');
      openReport(available.includes(requested)?requested:available[0]);
    }catch{
      if(ticket!==generation)return;
      clearTimeout(timer);state('Não foi possível carregar a lista de relatórios. Tente novamente.',true);
    }
  }
  document.getElementById('filter').addEventListener('submit',event=>{event.preventDefault();if(available.includes(dateInput.value))openReport(dateInput.value);});
  retry.addEventListener('click',()=>{if(available.includes(dateInput.value))openReport(dateInput.value);else loadManifest();});
  addEventListener('pagehide',cancel);
  loadManifest();
})();
