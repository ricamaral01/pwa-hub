import {useEffect,useMemo,useState} from 'react';

type HistoricalRow={
 grupo:string;data_producao:string;data_producao_iso:string;corpo_prova:string;
 data_ensaio:string;absorcao_pct:string;resultado_individual:string;
 media_pct:string;resultado_media:string;
};
type HistoricalResponse={linhas:HistoricalRow[];grupos:number;total:number};

export default function AbsorptionHistory(){
 const [rows,setRows]=useState<HistoricalRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [de,setDe]=useState('');
 const [ate,setAte]=useState('');
 useEffect(()=>{
  let active=true;
  fetch('/api/absorcao/historico',{credentials:'same-origin'})
   .then(async response=>{if(!response.ok)throw new Error('Não foi possível carregar o histórico de absorção.');return response.json() as Promise<HistoricalResponse>})
   .then(data=>{if(active)setRows(data.linhas)})
   .catch(reason=>{if(active)setError((reason as Error).message)})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 const filtered=useMemo(()=>rows.filter(row=>(!de||row.data_producao_iso>=de)&&(!ate||row.data_producao_iso<=ate)),[rows,de,ate]);
 const groups=useMemo(()=>new Set(filtered.map(row=>row.grupo)).size,[filtered]);
 const params=new URLSearchParams();
 if(de)params.set('de',de);
 if(ate)params.set('ate',ate);
 const printUrl='/api/absorcao/historico/relatorio'+(params.size?'?'+params.toString():'');
 const invalidPeriod=Boolean(de&&ate&&de>ate);
 return <section className="panel absorption-history" aria-labelledby="abs-history-title">
  <div className="panelHead"><div><div className="eyebrow">Resultados históricos informados</div><h2 id="abs-history-title">Absorção por imersão</h2></div>
   <a className="btn" href={invalidPeriod?'#abs-history-title':printUrl} target={invalidPeriod?undefined:'_blank'} rel="noopener" aria-disabled={invalidPeriod||loading||Boolean(error)} onClick={event=>{if(invalidPeriod||loading||error)event.preventDefault()}}>Versão para impressão ↗</a></div>
  <p className="note">Registros de 2024 a 2026. Os percentuais e as médias foram transcritos dos dados fornecidos; não há pesagens originais para recalcular estes ensaios.</p>
  <div className="abs-history-filters"><label className="field"><span>Produção de</span><input className="input" type="date" value={de} onChange={event=>setDe(event.target.value)}/></label>
   <label className="field"><span>Produção até</span><input className="input" type="date" value={ate} onChange={event=>setAte(event.target.value)}/></label>
   <strong>{groups} grupos · {filtered.length} corpos de prova</strong></div>
  {invalidPeriod&&<p className="warning">A data inicial deve ser anterior à data final.</p>}
  {loading&&<p className="note">Carregando histórico…</p>}
  {error&&<p className="warning" role="alert">{error}</p>}
  {!loading&&!error&&<div className="abs-history-table-wrap"><table className="abs-history-table"><thead><tr>
   <th>Data Produção</th><th>Corpo de Prova</th><th>Data do Ensaio</th><th>Absorção por Imersão (%)</th>
   <th>NBR 8451-1 (Individual ≤ 7)</th><th>Média</th><th>NBR 8451-1 (Média ≤ 5,5)</th>
  </tr></thead><tbody>{filtered.map((row,index)=><tr key={`${row.grupo}-${index}`} className={row.media_pct?'abs-group-start':''}>
   <td>{row.data_producao}</td><td>{row.corpo_prova}</td><td>{row.data_ensaio}</td><td>{row.absorcao_pct}</td>
   <td>{row.resultado_individual}</td><td>{row.media_pct}</td><td>{row.resultado_media}</td>
  </tr>)}</tbody></table>{filtered.length===0&&<p className="note">Nenhum registro no período selecionado.</p>}</div>}
  <p className="note">Campos vazios e datas sem ano foram preservados como enviados. Os limites são os indicados na tabela de origem; confirme o critério normativo vigente antes de emitir laudo oficial.</p>
 </section>;
}
