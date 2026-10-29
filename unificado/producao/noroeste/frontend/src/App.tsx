import {useEffect,useState} from 'react';
import {api} from './api';
import type {Product,Tab} from './types';
import {DayPage} from './DayPage';
import {LaborPage} from './LaborPage';
import {MonthPage} from './MonthPage';
import {SharedProductPage} from './SharedProductPage';

const tabs:Record<Tab,string>={
  apontamento:'Apontamento do dia','mao-de-obra':'Mão de obra',mensal:'Produção Noroeste',
  indicadores:'Indicadores',produtos:'Produtos Campinas',
};
const requested=new URLSearchParams(location.search).get('tab');
const tab:Tab=requested && Object.hasOwn(tabs,requested)?requested as Tab:'apontamento';

export function App(){
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const reloadProducts=()=>api<{produtos:Product[]}>('/produtos').then(data=>setProducts(data.produtos));
  useEffect(()=>{document.title=`${tabs[tab]} · Produção Noroeste`;
    reloadProducts().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  const notify=(message:string)=>{setNotice(message);setTimeout(()=>setNotice(''),5500);};
  return <main className="pdr-app">
    <header className="pdr-head">
      <div><div className="eyebrow">CONCREFER / PRODUÇÃO / NOROESTE</div><h1>{tabs[tab]}</h1>
        <p>Produção, equipe e acompanhamento com dados por unidade.</p></div>
      <div className="button-row"><a className="button" href="/unificado/producao/noroeste/app/" target="_blank" rel="noreferrer">App de produção</a>
        <a className="button" href="/unificado/producao/noroeste/mao-de-obra/app/" target="_blank" rel="noreferrer">App de mão de obra</a>
        <a className="button ghost" href="/unificado/" target="_top">← Voltar ao início</a></div>
    </header>
    <nav className="tabbar" aria-label="Produção Noroeste">{(Object.keys(tabs) as Tab[]).map(key=><a
      href={`?tab=${key}`} key={key} aria-current={key===tab?'page':undefined}>{tabs[key]}</a>)}</nav>
    {notice&&<div className="notice" role="status">{notice}</div>}
    {error?<div className="state-card error" role="alert"><h2>Não foi possível abrir os dados</h2><p>{error}</p><button className="button" onClick={()=>location.reload()}>Tentar novamente</button></div>
      :loading?<div className="state-card">Carregando produção...</div>
      :tab==='produtos'?<SharedProductPage products={products}/>
      :tab==='apontamento'?<DayPage products={products} notify={notify}/>
      :tab==='mao-de-obra'?<LaborPage notify={notify}/>
      :tab==='mensal'?<MonthPage products={products} notify={notify}/>
      :<div className="state-card"><span className="badge muted">Próxima etapa</span><h2>Indicadores</h2><p>Os indicadores avançados serão liberados após a conferência da produção e da classificação das áreas.</p></div>}
  </main>;
}
