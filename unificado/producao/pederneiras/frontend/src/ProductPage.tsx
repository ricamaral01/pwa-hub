import {useMemo,useState} from 'react';
import {api,download,send} from './api';
import type {Preview,Product} from './types';
import {fmt} from './types';

type Form={familia:string;letra:string;descricao:string;cod_pro:string;cod_sma:string;volume_m3:string;ativo:boolean;pendencia:string};
const blank:Form={familia:'',letra:'',descricao:'',cod_pro:'',cod_sma:'',volume_m3:'',ativo:true,pendencia:''};
const toForm=(product:Product):Form=>({familia:product.familia,letra:product.letra||'',descricao:product.descricao,
  cod_pro:product.cod_pro||'',cod_sma:product.cod_sma||'',volume_m3:product.volume_m3===null?'':String(product.volume_m3),
  ativo:product.ativo,pendencia:product.pendencia||''});

export function ProductPage({products,reload,notify}:{products:Product[];reload:()=>Promise<void>;notify:(message:string)=>void}){
  const [search,setSearch]=useState('');const [filter,setFilter]=useState<'pendentes'|'ativos'|'todos'>('pendentes');
  const [editing,setEditing]=useState<number|null>(null);const [form,setForm]=useState<Form>(blank);
  const [file,setFile]=useState<File|null>(null);const [preview,setPreview]=useState<Preview|null>(null);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const visible=useMemo(()=>products.filter(product=>{
    if(filter==='pendentes'&&!product.pendencia)return false;
    if(filter==='ativos'&&!product.ativo)return false;
    const haystack=[product.descricao,product.cod_pro,product.cod_sma,product.letra,product.familia].join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  }),[products,filter,search]);
  const field=(key:keyof Form,value:string|boolean)=>setForm(current=>({...current,[key]:value}));
  const save=async()=>{setBusy(true);setError('');try{
    const payload={...form,letra:form.letra||null,cod_pro:form.cod_pro||null,cod_sma:form.cod_sma||null,
      volume_m3:form.volume_m3===''?null:Number(form.volume_m3.replace(',','.')),pendencia:form.pendencia||null};
    if(editing)await send(`/produtos/${editing}`,'PATCH',payload);else await send('/produtos','POST',payload);
    await reload();setEditing(null);setForm(blank);notify('Produto salvo com auditoria.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const importFile=async(apply:boolean)=>{if(!file)return;setBusy(true);setError('');try{
    const body=new FormData();body.append('arquivo',file);
    const result=await api<Preview>(`/produtos/importar?aplicar=${apply}`,{method:'POST',body});
    setPreview(result);if(apply){await reload();notify('Catálogo importado com auditoria.');}
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="page-grid product-grid">
    <section className="panel wide">
      <div className="panel-heading"><div><span className="eyebrow">CATÁLOGO</span><h2>Produtos e códigos</h2><p>Divergências aparecem primeiro. Volume vazio mantém o m³ pendente.</p></div><span className="badge">{products.length} produtos</span></div>
      <div className="toolbar"><input className="search" aria-label="Buscar produtos" placeholder="Buscar nome, código, letra ou família" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select aria-label="Filtrar produtos" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="pendentes">Com pendência</option><option value="ativos">Ativos</option><option value="todos">Todos</option></select>
        <button className="button" onClick={()=>{setEditing(null);setForm(blank);}}>+ Novo produto</button></div>
      <div className="table-scroll"><table><thead><tr><th>Família</th><th>Letra</th><th>Produto</th><th>Cód. Pro</th><th>Cód. SMA</th><th>m³/peça</th><th>Situação</th><th></th></tr></thead><tbody>
        {visible.map(product=><tr key={product.id}><td>{product.familia}</td><td>{product.letra||'—'}</td><td><strong>{product.descricao}</strong></td><td>{product.cod_pro||'—'}</td><td>{product.cod_sma||'—'}</td><td>{fmt(product.volume_m3,4)}</td><td>{product.pendencia?<span className="badge alert" title={product.pendencia}>Revisar</span>:<span className="badge success">OK</span>}</td><td><button className="text-button" onClick={()=>{setEditing(product.id);setForm(toForm(product));}}>Editar</button></td></tr>)}
      </tbody></table>{visible.length===0&&<div className="empty-inline">Nenhum produto neste filtro.</div>}</div>
    </section>
    <aside className="side-stack"><section className="panel"><span className="eyebrow">{editing?'EDITAR':'CADASTRAR'}</span><h2>{editing?'Produto selecionado':'Novo produto'}</h2>
      <div className="form-grid">{(['familia','descricao','letra','cod_pro','cod_sma','volume_m3','pendencia'] as const).map(key=><label key={key} className={key==='descricao'||key==='pendencia'?'span2':''}><span>{({familia:'Família',descricao:'Descrição',letra:'Letra',cod_pro:'Cód. Pro',cod_sma:'Cód. SMA',volume_m3:'m³ por peça',pendencia:'Situação / pendência'} as const)[key]}</span><input value={form[key]} onChange={e=>field(key,e.target.value)} /></label>)}
        <label className="checkbox span2"><input type="checkbox" checked={form.ativo} onChange={e=>field('ativo',e.target.checked)}/> Produto ativo</label></div>
      <button className="button primary full" disabled={busy||!form.familia.trim()||!form.descricao.trim()} onClick={save}>Salvar produto</button></section>
      <section className="panel"><span className="eyebrow">IMPORTAR TABELA</span><h2>Comparar antes de gravar</h2><p>CSV ou XLSX. A prévia mostra inclusões, alterações e conflitos.</p>
        <input type="file" accept=".csv,.xlsx" onChange={e=>{setFile(e.target.files?.[0]||null);setPreview(null);}} aria-label="Arquivo de produtos"/>
        <div className="button-row"><button className="button" disabled={!file||busy} onClick={()=>importFile(false)}>Ver prévia</button><button className="button ghost" onClick={()=>download('/produtos/modelo.xlsx','modelo_produtos.xlsx').catch(e=>setError(e.message))}>Baixar modelo</button></div>
        {preview&&<div className="import-preview"><strong>{preview.resumo.criar} novos · {preview.resumo.atualizar} alterações · {preview.resumo.conflito} conflitos</strong><div className="preview-list">{preview.diferencas.filter(item=>item.acao!=='igual').slice(0,20).map(item=><p key={item.linha}>Linha {item.linha} · {item.acao} · {item.produto.descricao}</p>)}</div><button className="button primary full" disabled={busy||preview.resumo.conflito>0||preview.aplicado} onClick={()=>importFile(true)}>Aplicar importação</button></div>}
      </section></aside>
    {error&&<div className="toast error" role="alert">{error}</div>}
  </div>;
}
