export const BASE='/unificado/logistica/api';
export const cats=['velocidade','aceleracao','frenagem','curva','distracao','distancia'];
export const labels:any={velocidade:'Velocidade',aceleracao:'Aceleração',frenagem:'Frenagem',curva:'Curva',distracao:'Distração',distancia:'Distância insegura'};
export const tabs=[['','Início'],['painel','Painel Km/Evento'],['correcoes','Correções e exclusões'],['fechamento','Fechamento trimestral'],['premiacao','Premiação'],['meses','Meses e importação'],['metas','Metas'],['motoristas','Motoristas'],['ajudantes','Ajudantes'],['mapeamento-cobli','Mapeamento Cobli'],['cadastros','Cadastros']];
export const fmt=(v:any,d=0)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(Number(v||0));
export const money=(v:any)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
export const monthLabel=(m:string)=>new Date(m.slice(0,7)+'-15T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'});
export function todayMonth(){return new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,7)}
export function trimestre(m:string){return m.slice(0,4)+'-T'+Math.ceil(Number(m.slice(5,7))/3)}
export async function api(path:string,unit:string,method='GET',body?:any,signal?:AbortSignal){
 const controller=new AbortController();const stop=()=>controller.abort();signal?.addEventListener('abort',stop,{once:true});if(signal?.aborted)controller.abort();
 const timer=setTimeout(stop,30000);
 try{
  const r=await fetch(BASE+path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,
   headers:{'X-Unidade':unit,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});
  let data:any;
  try{data=await r.json()}catch(e){if(controller.signal.aborted)throw e;throw Error('Resposta indisponível. Tente novamente.')}
  if(controller.signal.aborted)throw new DOMException('Consulta cancelada.','AbortError');
  if(!r.ok){if(r.status===401)location.assign('/unificado/login.html?next='+encodeURIComponent(location.pathname+location.search));throw Error(typeof data.detail==='string'?data.detail:'Confira os campos informados.')}
  return data;
 }catch(e:any){if(controller.signal.aborted&&!signal?.aborted)throw Error('A conexão demorou. Tente novamente.');throw e}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',stop)}
}
export async function download(path:string,unit:string){const r=await fetch(BASE+path,{credentials:'same-origin',headers:{'X-Unidade':unit}});if(!r.ok)throw Error('Não foi possível baixar o arquivo.');const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=r.headers.get('Content-Disposition')?.match(/filename="?([^";]+)/)?.[1]||'relatorio.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
