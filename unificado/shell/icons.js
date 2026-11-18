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
 window.UnificadoIcons=Object.freeze({html,node});
})();
