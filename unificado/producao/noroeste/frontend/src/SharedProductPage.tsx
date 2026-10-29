import {useMemo,useState} from 'react';
import type {Product} from './types';
import {fmt} from './types';

export function SharedProductPage({products}:{products:Product[]}){
  const [search,setSearch]=useState('');
  const visible=useMemo(()=>products.filter(product=>
    [product.descricao,product.cod_pro,product.familia].join(' ').toLocaleLowerCase('pt-BR')
      .includes(search.toLocaleLowerCase('pt-BR'))),[products,search]);
  return <section className="panel wide">
    <div className="panel-heading"><div><span className="eyebrow">CADASTRO COMPARTILHADO</span>
      <h2>Produtos de Campinas</h2><p>Noroeste utiliza o cadastro de Campinas. Alterações de nome, código, volume e peso aparecem aqui após atualizar a tela.</p>
    </div><span className="badge">{products.length} produtos</span></div>
    <div className="toolbar"><input className="search" aria-label="Buscar produtos" placeholder="Buscar produto ou código" value={search} onChange={event=>setSearch(event.target.value)}/></div>
    <div className="table-scroll"><table><thead><tr><th>Família</th><th>Produto</th><th>Cód. Pro</th><th>m³/peça</th><th>kg/peça</th><th>Situação</th></tr></thead>
      <tbody>{visible.map(product=><tr key={product.id}><td>{product.familia}</td><td><strong>{product.descricao}</strong></td>
        <td>{product.cod_pro||'—'}</td><td>{fmt(product.volume_m3,4)}</td><td>{fmt(product.peso_unitario_kg,2)}</td>
        <td>{product.volume_m3==null||product.peso_unitario_kg==null?<span className="badge alert">Dados pendentes</span>:<span className="badge success">OK</span>}</td></tr>)}</tbody>
    </table>{visible.length===0&&<div className="empty-inline">Nenhum produto encontrado.</div>}</div>
  </section>;
}
