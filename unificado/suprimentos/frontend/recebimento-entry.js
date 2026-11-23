let response=await fetch('/api/suprimentos/me',{credentials:'same-origin',cache:'no-store'});
if(response.status===401){
  const renewed=await fetch('/unificado/suprimentos/session-renew',{credentials:'same-origin',cache:'no-store'}).catch(()=>null);
  if(renewed?.ok)response=await fetch('/api/suprimentos/me',{credentials:'same-origin',cache:'no-store'});
}
if(response.ok&&(await response.json()).flags?.S3C){
  await import('./recebimento-acompanhamento.js?v=1.4.3');
  await import('./recebimento-excecao.js?v=1.4.3');
  await import('./recebimento-financeiro.js?v=1.4.3');
  if(!['excecao','sem_pedido','financeiro'].some(k=>new URLSearchParams(location.search).has(k)))await import('./recebimento-pedido.js?v=1.4.3');
}
else await import('./recebimento.js?v=1.4.3');
