import React from 'react';
import {fmt} from './api';
type Any=any;
export function GeneralPreview({value,busy,confirm,cancel}:Any){
 const children=value.importacoes||[];
 const count=(p:Any,decision:string)=>p.linhas.filter((r:Any)=>r.decisao===decision).length;
 const errors=children.some((p:Any)=>count(p,'erro')>0);
 const writable=children.some((p:Any)=>p.status==='previa'&&count(p,'aceita')>0);
 return <><strong>{value.nome_arquivo}</strong><p>Arquivo geral · {value.periodo_inicio} a {value.periodo_fim}</p>
 <p>Confira cada unidade abaixo. Uma confirmação grava as unidades abertas. Meses fechados mostram diferenças e permanecem preservados.</p>
 {children.map((p:Any)=><details className="lg-card" key={p.id} open><summary><strong>{p.unidade}</strong> · {count(p,'aceita')} válidos · {count(p,'remocao')} remoções · {p.status==='diferenca'?'Mês fechado · somente diferenças':p.status==='confirmada'?'Já confirmada':'Aguardando confirmação'}</summary>
 <div className="lg-mini-kpis"><span>{p.linhas.filter((r:Any)=>r.novo).length} novos</span><span>{count(p,'erro')} erros</span></div>
 {p.status==='diferenca'&&<p className="lg-alert warn">Os números fechados desta unidade não serão sobrescritos.</p>}
 <div className="lg-preview-lines">{p.linhas.map((r:Any,i:number)=><article key={i}><b>Linha {r.linha} · {r.nome||'Fora do escopo'}</b><small>{r.decisao} {r.novo?'· novo motorista':''} · {r.motivo||`${fmt(r.km,1)} km`}</small>{r.diferenca_km!==undefined&&<small>Diferença: {fmt(r.diferenca_km,2)} km · eventos {JSON.stringify(r.diferenca_eventos)}</small>}</article>)}</div></details>)}
 {value.ignoradas?.length>0&&<details><summary>{value.ignoradas.length} linhas não importadas</summary>{value.ignoradas.map((r:Any,i:number)=><p key={i}>Linha {r.linha}: {r.motivo}</p>)}</details>}
 {value.sem_alteracao?.map((u:Any)=><p key={u.unidade_id}>{u.unidade}: {u.motivo}</p>)}
 {errors&&<p className="lg-alert bad">Resolva os erros antes de confirmar o arquivo geral.</p>}
 <div className="lg-actions"><button disabled={busy} onClick={cancel}>Cancelar prévias</button><button className="primary" disabled={busy||errors||!writable} onClick={confirm}>Confirmar unidades abertas</button></div></>;
}
