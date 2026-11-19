/* One outline icon set for shell, module lists and navigation. */
(() => {
 const paths={
  inicio:'M4 11 12 4l8 7v9h-6v-6h-4v6H4z',
  planejamento:'M4 5h16v15H4z M4 10h16 M8 3v4 M16 3v4',
  producao:'M3 20V10l6 3v-3l6 3V6h6v14z',
  qualidade:'M12 3 20 6v6c0 5-4 8-8 9-4-1-8-4-8-9V6z M8 12l3 3 5-6',
  laboratorio:'M9 3h6 M10 3v6L5 18q-2 3 2 3h10q4 0 2-3l-5-9V3 M7 15h10',
  usinas:'M4 20h16 M6 20V9h5v11 M11 13h7v7 M8 6V3',
  suprimentos:'M4 4h2l2 11h10l2-8H7 M9 19h.01 M17 19h.01',
  logistica:'M3 6h11v10H3z M14 9h4l3 3v4h-7 M5 17a2 2 0 1 0 4 0 M15 17a2 2 0 1 0 4 0',
  ged:'M3 6h6l2 2h10v12H3z',
  documento:'M14 3H6v18h12V7z M14 3v5h4 M9 12h6 M9 16h6',
  pederh:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2q0-5 7-5t7 5v2 M18 5a3 3 0 0 1 0 6 M19 14q3 1 3 5',
  faleaqui:'M3 4h18v13H9l-6 4z M7 8h10 M7 12h7',
  busca:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  conta:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21v-2q0-5 8-5t8 5v2',
  menu:'M4 6h16 M4 12h16 M4 18h16',
  recentes:'M3 12a9 9 0 1 0 3-7 M3 3v6h6 M12 7v5l3 2',
 };
 function html(name='documento') {return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.documento}"/></svg>`;}
 function node(name,className=''){const span=document.createElement('span');span.className=className;span.innerHTML=html(name);return span;}
 Object.assign(paths,{
  grafico:'M4 19h16 M7 16V9 M12 16V5 M17 16v-4',
  calendario:paths.planejamento, etiqueta:'M3 4h9l9 9-8 8-10-10z M8 8h.01',
  leitor:'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5 M7 12h10',
  qr:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h4v4h-7z',
  lista:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  pasta:paths.ged,caixa:'M4 8l8-4 8 4v9l-8 4-8-4z M4 8l8 4 8-4 M12 12v9',
  carrinho:paths.suprimentos,caminhao:paths.logistica,tendencia:'M4 19h16 M4 16l5-7 4 3 7-9',pessoa:paths.conta
 });
 function forScreen(item={}){
  const key=(item.id||'')+' '+(item.label||'');
  const text=key.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  for(const [pattern,name] of [[/usuario|users/,'pessoa'],[/qr/,'qr'],[/etiquet/,'etiqueta'],[/leitura|ruptura/,'leitor'],[/numeros.?serie|numeros de serie|postesnumeros/,'lista'],[/estatistica|cec|comparacao|comparad/,'tendencia'],[/relatorio|report|pdf|fechamento/,'documento'],[/dashboard|indicador|painel|acompanhamento/,'grafico'],[/programa|circular|pcpdiario/,'calendario'],[/estoque|almoxarif|inventario/,'caixa'],[/fornecedor|recebimento/,'caminhao'],[/compra|cotac|solicita/,'carrinho'],[/cadastro|produto|catalog/,'pasta']])if(pattern.test(text))return name;
  return '';
 }
 const originalHtml=html;
 function screenHtml(name){return name?originalHtml(name):'';}
 function screenNode(name,className=''){const span=document.createElement('span');span.className=className;span.innerHTML=screenHtml(name);return span;}
 window.UnificadoIcons=Object.freeze({html:screenHtml,node:screenNode,forScreen});
 function resolveEntry(entries,view,id,viewOf){
  if(!view)return null;
  const exact=entries.find(e=>viewOf(e.item)===view);if(exact)return exact;
  const resolved=entries.find(e=>e.item.id===id);if(resolved)return resolved;
  const path=value=>String(value||'').split(/[?#]/)[0].replace(/\/$/,'');
  return entries.find(e=>!/[?#]/.test(viewOf(e.item))&&path(viewOf(e.item))===path(view))||null;
 }
 function shortcutLabel(group,label){return group&&group!=='Geral'&&!String(label).toLocaleLowerCase('pt-BR').includes(String(group).toLocaleLowerCase('pt-BR'))?`${group} · ${label}`:label;}
 window.UnificadoPresentation={resolveEntry,shortcutLabel,descriptions:{"dashboard": "Programado e realizado por per\u00edodo", "comparacao": "PCP contra apontamentos do Mapa", "programacao12": "Programar a produ\u00e7\u00e3o di\u00e1ria", "programacaoSemanal12": "Distribuir a semana nas formas", "programacao34": "Programar os setores 3 e 4", "circular3": "Sequenciar formas circulares", "dt4": "Programar postes duplo T", "programacaoFinal": "Consolidar a programa\u00e7\u00e3o para publicar", "postesNumerosSerie": "Consultar s\u00e9ries e emitir PDF", "armadurasProgramacao": "Programar armaduras por dia", "armadurasRelatorio": "Emitir relat\u00f3rio de armaduras", "relatorio12": "Emitir PDF dos setores 1 e 2", "relatorio3": "Emitir PDF do setor 3", "relatorio4": "Emitir PDF do setor 4", "labCartaTraco": "Cadastrar e revisar cartas de tra\u00e7o", "labLeitura": "Registrar a ruptura de corpos de prova", "labResultados": "Consultar resultados dos ensaios", "suprimentosPainel": "Aprovar e acompanhar solicita\u00e7\u00f5es", "suprimentosSolicitacoes": "Consultar e filtrar solicita\u00e7\u00f5es", "suprimentosNova": "Solicitar materiais e servi\u00e7os", "suprimentosAlmoxarifado": "Consultar saldos e movimenta\u00e7\u00f5es", "suprimentosInventario": "Conferir o estoque f\u00edsico", "suprimentosCotacoes": "Comparar propostas de fornecedores"}};
})();
