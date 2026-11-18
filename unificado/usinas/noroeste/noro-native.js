const API = '/unificado/mapa/api/usinas/noro';
const STYLE = '/unificado/usinas/noroeste/noro-native.css?v=1.4.11';
const label = {painel:'Painel',massadas:'Massadas',cartas:'Cartas de traço',relatorios:'Relatórios',cec:'Controle estatístico',cadastros:'Cadastros',estoque:'Estoque',custos:'Custos'};
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
const number = (value, digits=1) => Number(value || 0).toLocaleString('pt-BR',{maximumFractionDigits:digits});
const displayDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value||'') ?
  `${value.slice(8,10)}/${value.slice(5,7)}/${value.slice(0,4)}` : value;
const el = (tag, text='', className='') => {
  const node=document.createElement(tag);
  if (text !== null) node.textContent=String(text);
  if (className) node.className=className;
  return node;
};
const query = params => new URLSearchParams(params).toString();
let refreshTimer;
async function get(path) {
  const response=await fetch(API+path,{credentials:'same-origin',cache:'no-store'});
  const data=await response.json().catch(()=>({error:'Resposta inválida'}));
  if (!response.ok || data.ok===false) throw new Error(data.error || `Falha ${response.status}`);
  return data;
}
function card(title,value,sub='') {
  const box=el('div',null,'noro-card');
  box.append(el('span',title,'noro-card-label'),el('strong',value,'noro-card-value'));
  if(sub) box.append(el('small',sub));
  return box;
}
function table(headers, rows) {
  const wrap=el('div',null,'noro-table-wrap');
  const t=el('table'); const head=el('thead'); const hr=el('tr');
  for(const h of headers) hr.append(el('th',h));
  head.append(hr); t.append(head);
  const body=el('tbody');
  for(const row of rows) {
    const tr=el('tr');
    for(const cell of row) {
      const td=el('td',null);
      if(cell instanceof Node) td.append(cell); else td.textContent=cell ?? '—';
      tr.append(td);
    }
    body.append(tr);
  }
  if (!rows.length) {
    const tr=el('tr'); const td=el('td','Nenhum registro para os filtros selecionados');
    td.colSpan=headers.length; tr.append(td); body.append(tr);
  }
  t.append(body); wrap.append(t); return wrap;
}
function section(title) {return el('h2',title,'noro-section-title')}
async function painel(content) {
  const data=await get('/painel');
  const k=data.kpis, meta=data.meta;
  const strip=el('div',null,'noro-status');
  strip.append(el('strong',meta.status),el('span',meta.statusHint));
  content.append(strip);
  const grid=el('div',null,'noro-grid');
  grid.append(card('Realizado',`${number(k.total)} m³`),card('Programado',`${number(k.programado)} m³`),
    card('Massadas',k.massadas),card('Ritmo',`${number(k.m3h,2)} m³/h`),
    card('Primeira / última',`${k.horaInicio} / ${k.horaFim}`),
    card('Paradas',data.paradas.total_paradas,`${number(data.paradas.total_atraso_min)} min`));
  content.append(grid,section('Produção por hora'));
  const bars=el('div',null,'noro-bars');
  const max=Math.max(1,...data.horas.map(x=>Number(x.m3)));
  for(const item of data.horas) {
    const row=el('div',null,'noro-bar-row');
    row.append(el('span',`${item.hora}h`));
    const track=el('div',null,'noro-bar-track'); const fill=el('div',null,'noro-bar-fill');
    fill.style.width=`${Math.max(0,Number(item.m3)/max*100)}%`; track.append(fill);
    row.append(track,el('strong',`${number(item.m3)} m³`)); bars.append(row);
  }
  content.append(bars,section('Setores'));
  content.append(table(['Setor','Programado','Realizado'],data.setores.setores.map(s=>
    [s,`${number(data.setores.pcp[s])} m³`,`${number((data.setores.realizado[s]||[]).reduce((a,b)=>a+Number(b),0))} m³`])));
  if(data.setores.sem_setor) content.append(el('p',`${data.setores.sem_setor} massada(s) sem setor.`, 'noro-note'));
  content.append(el('p','Indicador de qualidade por massada indisponível: não há vínculo confiável na origem.','noro-note'));
}
async function massadas(content) {
  const form=el('form',null,'noro-filters');
  const start=el('input'); start.type='date'; start.name='data_ini'; start.value=today();
  const end=el('input'); end.type='date'; end.name='data_fim'; end.value=today();
  const product=el('input'); product.placeholder='Produto'; product.name='produto';
  const sector=el('input'); sector.placeholder='Setor'; sector.name='setor';
  const submit=el('button','Filtrar'); submit.type='submit';
  const exportLink=el('a','Exportar XLSX','noro-button'); exportLink.href='#';
  for(const [name,input] of [['De',start],['Até',end],['Produto',product],['Setor',sector]]) {
    const field=el('label',name); field.append(input); form.append(field);
  }
  form.append(submit,exportLink); content.append(form);
  const result=el('div'); content.append(result);
  const dialog=el('dialog',null,'noro-dialog');
  const editForm=el('form',null,'noro-edit-form');editForm.method='dialog';
  const editTitle=el('h2','Anotar massada');
  const editSector=el('input');editSector.maxLength=100;
  const editActive=el('select');
  for(const [value,text] of [['','Sem alteração'],['true','Sim'],['false','Não']]) {
    const option=el('option',text);option.value=value;editActive.append(option);
  }
  const editRedosa=el('input');editRedosa.type='number';editRedosa.min='0';
  for(const [title,input] of [['Setor',editSector],['Ativa',editActive],['Redosa',editRedosa]]) {
    const field=el('label',title);field.append(input);editForm.append(field);
  }
  const error=el('p','','noro-error');error.hidden=true;
  const controls=el('div',null,'noro-edit-controls');
  const cancel=el('button','Cancelar');cancel.type='button';cancel.addEventListener('click',()=>dialog.close());
  const save=el('button','Salvar');save.type='submit';
  controls.append(cancel,save);editForm.prepend(editTitle);editForm.append(error,controls);
  dialog.append(editForm);content.append(dialog);
  let editingId=null;
  editForm.addEventListener('submit',async event=>{
    event.preventDefault();if(editingId===null)return;
    save.disabled=true;error.hidden=true;
    const payload={setor:editSector.value.trim()||null,
      ativa:editActive.value===''?null:editActive.value==='true',
      redosa:editRedosa.value===''?null:Number(editRedosa.value)};
    try {
      const response=await fetch(`${API}/massadas/${editingId}/anotacao`,{
        method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Não foi possível salvar');
      dialog.close();await load();
    }catch(e){error.textContent=e.message;error.hidden=false}
    finally{save.disabled=false}
  });
  const params=()=>query({data_ini:start.value,data_fim:end.value,produto:product.value,setor:sector.value});
  async function load() {
    result.replaceChildren(el('p','Carregando…'));
    try {
      const data=await get('/massadas?'+params());
      const rows=data.rows.map(r=>{
        const cells=[displayDate(r.data),String(r.hora||'').slice(0,8),r.numero_serie,r.produto,r.formula,`${number(r.qtd)} m³`,
          r.setor_efetivo,r.ativa_efetiva===null?'—':r.ativa_efetiva?'Sim':'Não',r.redosa_efetiva];
        if(data.pode_anotar) {
          const button=el('button','Anotar','noro-link-button');button.type='button';
          button.addEventListener('click',()=>{
            editingId=r.id;editTitle.textContent=`Anotar massada ${r.numero_serie||r.id}`;
            editSector.value=r.setor_efetivo||'';
            editActive.value=r.ativa_efetiva===null?'':String(r.ativa_efetiva);
            editRedosa.value=r.redosa_efetiva??'';dialog.showModal();
          });cells.push(button);
        }
        return cells;
      });
      result.replaceChildren(table(['Data','Hora','Série','Produto','Fórmula','Volume','Setor','Ativa','Redosa',
        ...(data.pode_anotar?['Ação']:[])],rows));
      result.prepend(el('p',`${data.rows.length} massada(s) exibidas; limite ${data.limit}.`,'noro-note'));
      exportLink.href=API+'/massadas.xlsx?'+params();
    } catch(e) {result.replaceChildren(el('p',e.message,'noro-error'))}
  }
  form.addEventListener('submit',event=>{event.preventDefault();load()});
  await load();
}
async function cartas(content) {
  const data=await get('/cartas');
  content.append(el('p','Cartas operacionais em consulta. Revisões históricas ficam no banco do Unificado.','noro-note'));
  const detail=el('section',null,'noro-detail');
  const rows=data.rows.map(r=>{
    const button=el('button','Detalhes','noro-link-button');button.type='button';
    button.addEventListener('click',()=>{
      const revisions=data.rows.filter(x=>x.revisao_grupo===r.revisao_grupo);
      const info=[['Nome',r.nome],['Traço',r.nome_traco],['Revisão',r.revisao_numero],
        ['Cimento 1',r.cimento1],['Cimento 2',r.cimento2],['Adição 2',r.adicao_2],
        ['Areia industrial',r.agregado1],['Areia natural',r.agregado3],
        ['Brita 1/2',r.agregado4],['Brita 0',r.agregado5],['Água',r.agua],
        ['Aditivo 1',r.aditivo1],['A/C',r.ac],['R24h',r.r24h],['R3',r.r3],['R7',r.r7],['R28',r.r28]];
      detail.replaceChildren(section(`Carta ${r.nome_traco} · revisão ${r.revisao_numero}`),
        table(['Campo','Valor'],info),section('Histórico de revisões'),
        table(['Revisão','Data','Ativa','Observação'],revisions.map(x=>
          [x.revisao_numero,x.revisado_em,x.ativa?'Sim':'Não',x.observacao_revisao])));
      detail.scrollIntoView({behavior:'smooth',block:'start'});
    });
    return [r.nome_traco,r.nome,r.revisao_numero,r.ativa?'Sim':'Não',r.ac,r.r28,button];
  });
  content.append(table(['Traço','Nome','Revisão','Ativa','A/C','R28',''],rows),detail);
}
async function relatorios(content) {
  const form=el('form',null,'noro-filters');
  const start=el('input'); start.type='date'; start.value=today();
  const end=el('input'); end.type='date'; end.value=today();
  const submit=el('button','Consultar'); submit.type='submit';
  const a=el('label','De');a.append(start); const b=el('label','Até');b.append(end);
  form.append(a,b,submit);content.append(form);
  const result=el('div');content.append(result);
  const monthly=el('div',null,'noro-filters');
  const month=el('input');month.type='month';month.value=today().slice(0,7);
  const monthLabel=el('label','Mês de fechamento');monthLabel.append(month);
  const monthButton=el('button','Consultar fechamento');monthButton.type='button';
  const monthResult=el('div');monthly.append(monthLabel,monthButton);content.append(section('Fechamento mensal'),monthly,monthResult);
  async function load(){
    result.replaceChildren(el('p','Carregando…'));
    try{
      const d=await get('/relatorios/producao?'+query({data_ini:start.value,data_fim:end.value}));
      const grid=el('div',null,'noro-grid');grid.append(card('Massadas',d.massadas),card('Volume',`${number(d.volume)} m³`));
      result.replaceChildren(grid,section('Produção diária'),table(['Data','Massadas','Volume'],d.dias.map(r=>
        [displayDate(r.data),r.massadas,`${number(r.volume)} m³`])));
    }catch(e){result.replaceChildren(el('p',e.message,'noro-error'))}
  }
  form.addEventListener('submit',e=>{e.preventDefault();load()});await load();
  monthButton.addEventListener('click',async()=>{
    if(!month.value)return;
    monthResult.replaceChildren(el('p','Carregando…'));
    try{
      const [ano,mes]=month.value.split('-');
      const d=await get('/relatorios/fechamento?'+query({ano,mes}));
      const grid=el('div',null,'noro-grid');grid.append(card('Massadas',d.massadas),card('Volume',`${number(d.volume)} m³`));
      monthResult.replaceChildren(grid,table(['Data','Massadas','Volume'],d.dias.map(r=>
        [displayDate(r.data),r.massadas,`${number(r.volume)} m³`])));
    }catch(e){monthResult.replaceChildren(el('p',e.message,'noro-error'))}
  });
}
async function cadastros(content) {
  const data=await get('/cadastros');
  content.append(el('p','Consulta em paralelo. Produtos ainda vêm do supervisório; alterações continuam no aplicativo antigo.','noro-note'));
  const grid=el('div',null,'noro-grid');
  grid.append(card('Produtos',data.produtos.length),card('Agregados',data.agregados.length),
    card('Mapeamentos',data.mapeamento.length));content.append(grid);
  content.append(section('Produtos'),table(['Código','Nome','Descrição','Ativo'],data.produtos.map(r=>
    [r.codigo,r.nome,r.descricao,r.ativo?'Sim':'Não'])));
  content.append(section('Agregados'),table(['Nome','Tipo','Unidade','Descrição','Ativo'],data.agregados.map(r=>
    [r.nome,r.tipo,r.unidade,r.descricao,r.ativo?'Sim':'Não'])));
  content.append(section('Campos da carta'),table(['Coluna','Rótulo','Material','Ativo'],data.mapeamento.map(r=>
    [r.coluna,r.label,r.material_id,r.ativo?'Sim':'Não'])));
}
async function estoque(content) {
  const data=await get('/estoque');
  const local=await get('/estoque/movimentos-locais');
  const balance=await get('/estoque/saldo');
  content.append(el('p','Saldo calculado no Unificado a partir do espelho Noroeste. O aplicativo antigo continua oficial para lançamentos.','noro-note'));
  const grid=el('div',null,'noro-grid');grid.append(card('Materiais',data.materiais.length),
    card('Silos',data.silos.length),card('Movimentos exibidos',data.movimentos.length));content.append(grid);
  content.append(section('Saldo calculado'),table(['Código','Material','Saldo','Unidade','Contábil','Déficit silo','Entradas','Consumo'],balance.rows.map(r=>
    [r.codigo,r.nome,number(r.saldo,3),r.unidade,number(r.saldo_contabil,3),
      number(r.deficit_silos,3),number(r.total_entradas,3),number(r.total_consumo,3)])));
  content.append(section('Materiais'),table(['Código','Nome','Categoria','Unidade','Saldo inicial','Ativo'],data.materiais.map(r=>
    [r.codigo,r.nome,r.categoria,r.unidade,number(r.saldo_inicial,3),r.ativo?'Sim':'Não'])));
  content.append(section('Silos'),table(['Nome','Capacidade nominal','Operacional','Unidade','Ativo'],data.silos.map(r=>
    [r.nome,number(r.capacidade_nominal,3),number(r.capacidade_operacional,3),r.unidade,r.ativo?'Sim':'Não'])));
  content.append(section('Mapeamento da massada'),table(['Coluna','Rótulo','Material','Fator','Ativo'],data.mapeamento.map(r=>
    [r.coluna,r.label,r.material_id,r.fator_conversao,r.ativo?'Sim':'Não'])));
  content.append(section('Movimentos'),table(['Data','Material','Tipo','Quantidade','Origem','Nota','Fornecedor'],data.movimentos.map(r=>
    [displayDate(r.data),r.material_id,r.tipo,number(r.quantidade,3),r.origem,r.nota_fiscal,r.fornecedor])));
  content.append(section('Movimentos locais'),table(['Data','Material','Tipo','Quantidade','Unidade','Criado em'],local.rows.map(r=>
    [displayDate(r.data),r.material_id,r.tipo,number(r.quantidade,3),r.unidade,String(r.created_at||'').slice(0,16)])));
  const previewForm=el('form',null,'noro-filters');
  const previewStart=el('input');previewStart.type='date';previewStart.value=today();
  const previewEnd=el('input');previewEnd.type='date';previewEnd.value=today();
  const previewButton=el('button','Consultar consumo');previewButton.type='submit';
  const from=el('label','De');from.append(previewStart);
  const to=el('label','Até');to.append(previewEnd);
  previewForm.append(from,to,previewButton);
  const previewResult=el('div');
  content.append(section('Consumo previsto das massadas'),
    el('p','Prévia calculada, sem gerar movimentos de estoque.','noro-note'),previewForm,previewResult);
  async function loadPreview(){
    try{
      const preview=await get('/estoque/consumo-previsto?'+query({data_ini:previewStart.value,data_fim:previewEnd.value}));
      previewResult.replaceChildren(el('p',`${preview.dias} dia(s) · ${preview.total} linha(s).`,'noro-note'),
        table(['Data','Material','Coluna','Consumo','Unidade','Silo'],preview.rows.map(r=>
          [displayDate(r.data),r.material_nome,r.coluna,number(r.quantidade,3),r.unidade,r.silo_id])));
    }catch(error){previewResult.replaceChildren(el('p',error.message,'noro-error'))}
  }
  previewForm.addEventListener('submit',event=>{event.preventDefault();loadPreview()});
  await loadPreview();
  if(local.escrita_habilitada){
    const form=el('form',null,'noro-cec-form');
    const material=el('select');material.required=true;
    const materialPlaceholder=el('option','Selecione o material');materialPlaceholder.value='';
    materialPlaceholder.disabled=true;materialPlaceholder.selected=true;material.append(materialPlaceholder);
    for(const row of data.materiais.filter(r=>r.ativo)){
      const option=el('option',`${row.codigo} · ${row.nome}`);option.value=row.legado_id;material.append(option);
    }
    const silo=el('select');const noSilo=el('option','Sem silo');noSilo.value='';silo.append(noSilo);
    for(const row of data.silos.filter(r=>r.ativo)){
      const option=el('option',row.nome);option.value=row.legado_id;silo.append(option);
    }
    const kind=el('select');for(const value of ['entrada','consumo','acerto']){
      const option=el('option',value);option.value=value;kind.append(option);
    }
    const movementDate=el('input');movementDate.type='date';movementDate.value=today();movementDate.required=true;
    const quantity=el('input');quantity.type='number';quantity.step='0.000001';quantity.required=true;
    const unit=el('select');for(const value of ['ton','kg','L','m3','sc']){
      const option=el('option',value);option.value=value;unit.append(option);
    }
    const note=el('input');note.type='text';note.maxLength=100;
    const value=el('input');value.type='number';value.min='0';value.step='0.01';value.value='0';
    const feedback=el('p','','noro-note');
    for(const [title,input] of [['Material',material],['Silo',silo],['Tipo',kind],['Data',movementDate],
      ['Quantidade',quantity],['Unidade',unit],['Nota fiscal',note],['Valor da nota',value]]){
      const label=el('label',title,'noro-cec-field');label.append(input);form.append(label);
    }
    const submit=el('button','Registrar movimento local','noro-button');submit.type='submit';
    form.append(submit,feedback);content.append(section('Novo movimento local'),form);
    form.addEventListener('submit',async event=>{
      event.preventDefault();submit.disabled=true;
      try{
        const payload={local_id:crypto.randomUUID(),material_id:Number(material.value),
          silo_id:silo.value?Number(silo.value):null,tipo:kind.value,data:movementDate.value,
          quantidade:Number(quantity.value),unidade:unit.value,nota_fiscal:note.value.trim()||null,
          valor_nota:Number(value.value||0)};
        const response=await fetch(API+'/estoque/movimentos-locais',{method:'POST',
          credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||`HTTP ${response.status}`);
        content.replaceChildren();await estoque(content);
      }catch(error){feedback.textContent=error.message}
      finally{submit.disabled=false}
    });
  }
  const errors=data.espelho.filter(r=>r.erro);
  content.append(el('p',errors.length?`${errors.length} erro(s) no espelho.`:'Espelho sem erro registrado.','noro-note'));
}
async function custos(content) {
  const data=await get('/custos');
  content.append(el('p','Ajustes e campos de custo espelhados para consulta. Apuração e edição de custos continuam no aplicativo antigo.','noro-note'));
  content.append(section('Ajustes'),table(['Vigência','Material','Valor unitário','Motivo','Responsável'],data.ajustes.map(r=>
    [displayDate(r.vigencia),r.material_id,number(r.valor_unitario,4),r.motivo,r.responsavel])));
  content.append(section('Valores dos movimentos'),table(['Data','Material','Tipo','Quantidade','Valor NF','Unitário líquido'],data.movimentos.map(r=>
    [displayDate(r.data),r.material_id,r.tipo,number(r.quantidade,3),number(r.valor_nota,2),number(r.valor_unitario_liquido,4)])));
}
export async function mountNoro(container,area) {
  clearInterval(refreshTimer);
  if(!label[area]) throw new Error('Área inválida');
  if(!document.querySelector('link[data-noro-style]')) {
    const css=el('link',null);css.rel='stylesheet';css.href=STYLE;css.dataset.noroStyle='1';document.head.append(css);
  }
  container.replaceChildren();container.className='noro-native';
  const header=el('header',null,'noro-header');
  const title=el('div');title.append(el('h1',label[area]));
  header.append(title,el('span','Dados do supervisório Noroeste','noro-origin'));
  const content=el('main',null,'noro-content');container.append(header,content);
  if(area==='painel') {
    await painel(content);
    refreshTimer=setInterval(async()=>{
      if(container.isConnected && container.closest('.module-host.is-native')) {
        try{content.replaceChildren();await painel(content)}catch(e){content.replaceChildren(el('p',e.message,'noro-error'))}
      }
    },120000);
  }
  if(area==='massadas') await massadas(content);
  if(area==='cartas') await cartas(content);
  if(area==='relatorios') await relatorios(content);
  if(area==='cadastros') await cadastros(content);
  if(area==='estoque') await estoque(content);
  if(area==='custos') await custos(content);
  if(area==='cec') {
    const cec=await import('./noro-cec.js?v=20261030-4');
    await cec.mountCec(content,API);
  }
}
