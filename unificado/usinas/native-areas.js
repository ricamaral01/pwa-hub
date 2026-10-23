(function(){
  const key = new URLSearchParams(location.search).get('area');
  const host = document.getElementById('area-nativa-conteudo');
  if (!host || !['cec','relatorios','estoque'].includes(key)) return;
  const base = '/unificado/mapa/api/usina/legacy/';
  const today = new Date().toLocaleDateString('en-CA');
  const month = today.slice(0,7);
  const D = (name,label,type='date',value=today) => ({name,label,type,value});
  const screens = {
    cec:[
      {id:'resultados',title:'Resultados',description:'Resultados dos corpos de prova registrados no CEC.',path:'qrcp',fields:[D('limit','Quantidade','number','200')]},
      {id:'relatorio',title:'Relatório CEC',description:'Consulte as leituras disponíveis. As estatísticas consolidadas dependem da API CEC.',path:'qrcp',fields:[D('limit','Quantidade','number','200')]},
      {id:'analise',title:'Análise',description:'A análise estatística consolidada ainda não possui uma consulta autorizada nesta ponte.'},
      {id:'leituras',title:'Leituras CEC',description:'Leituras registradas dos corpos de prova.',path:'qrcp',fields:[D('limit','Quantidade','number','50')]},
      {id:'dashboard',title:'Dashboard CEC',description:'Indicadores de conformidade estatística ainda indisponíveis nesta ponte.'},
      {id:'etiquetas',title:'Etiquetas',description:'Massadas para identificação dos corpos de prova.',path:'massadas',fields:[D('data_ini','Data inicial'),D('data_fim','Data final')]}
    ],
    relatorios:[
      {id:'cartas',title:'Cartas de traço',description:'Cartas e custo dos materiais.',path:'relatorios/cartas-traco',fields:[D('data_ini','Data inicial'),D('data_fim','Data final'),D('q','Buscar traço','text','')]},
      {id:'consumo',title:'Consumo de materiais',description:'Consumo agregado por período.',path:'relatorios/consumo',fields:[D('data_ini','Data inicial'),D('data_fim','Data final'),D('produto','Produto','text',''),D('formula','Fórmula','text','')]},
      {id:'custos',title:'Custos do concreto',description:'Custos gerenciais contabilizados.',path:'relatorios/custos'},
      {id:'comparar',title:'Comparar traços',description:'Compare as cartas no resultado da consulta de custos.',path:'relatorios/cartas-traco'},
      {id:'exportar',title:'Exportar massadas',description:'Consulte e exporte os registros exibidos nesta tela.',path:'massadas',fields:[D('data_ini','Data inicial'),D('data_fim','Data final')]},
      {id:'fechamento',title:'Fechamento mensal',description:'Indicadores do fechamento da usina.',path:'relatorios/fechamento',fields:[D('ano','Ano','number',today.slice(0,4))]},
      {id:'fechamento-diario',title:'Fechamento diário',description:'Resumo diário da produção.',path:'relatorios/fechamento-diario',fields:[D('data','Data')]},
      {id:'producao',title:'Produção por período',description:'Massadas e indicadores de ritmo no período.',path:'relatorios/producao-periodo',fields:[D('data_ini','Data inicial'),D('data_fim','Data final'),D('produto','Produto','text','')]},
      {id:'reports',title:'Reports diários',description:'A geração dos reports executa uma rotina na origem e ainda não está disponível no Unificado.'}
    ],
    estoque:[
      {id:'entrada',title:'Entrada de materiais',description:'Consulte entradas registradas. O cadastro de notas permanece pendente.',path:'estoque/movimentos',fixed:{tipo:'entrada',limit:'100'},fields:[D('data_ini','Data inicial'),D('data_fim','Data final')]},
      {id:'saldo',title:'Saldo de estoque',description:'Saldo atual por material e silo.',path:'estoque/saldo'},
      {id:'relatorio',title:'Relatório de consumo',description:'Entradas, consumos e acertos por material.',path:'estoque/relatorio',fields:[D('data_ini','Data inicial'),D('data_fim','Data final')]},
      {id:'consumo',title:'Consumo de agregados',description:'Consumo calculado na origem.',path:'estoque/consumo-agregados/analise'},
      {id:'cimento',title:'Consumo de cimento',description:'Nível de cimento por silo.',path:'estoque/silos/nivel'},
      {id:'mapeamento',title:'Mapeamento das caixas',description:'Configuração do misturador e materiais.',path:'estoque/config-massada'},
      {id:'acerto',title:'Acerto de estoque',description:'Histórico de acertos. O registro de novos acertos permanece pendente.',path:'estoque/movimentos',fixed:{tipo:'acerto',limit:'100'}}
    ]
  };
  const list = screens[key];
  const el = (tag,cls,value) => {const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n};
  const wrap=el('div','native-wrap'), tabs=el('div','native-tabs'), panel=el('div','native-panel');
  tabs.setAttribute('role','tablist');wrap.append(tabs,panel);host.append(wrap);
  let current=list[0], lastPayload=null;
  function button(label,cls,fn){const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b}
  function showStatus(message,error=false){const status=panel.querySelector('.native-status');if(status){status.textContent=message;status.classList.toggle('error',error)}}
  function plain(value){if(value==null)return '—';if(typeof value==='object')return JSON.stringify(value);return String(value)}
  function renderTable(rows,parent){
    if(!rows.length){parent.append(el('p','native-status','Nenhum registro encontrado.'));return}
    const keys=[...new Set(rows.slice(0,20).flatMap(row=>Object.keys(row||{})))].slice(0,15);
    const scroll=el('div','scroll'),table=el('table'),head=el('thead'),tr=el('tr');
    keys.forEach(k=>tr.append(el('th','',k.replaceAll('_',' '))));head.append(tr);table.append(head);
    const body=el('tbody');for(const row of rows.slice(0,500)){const line=el('tr');keys.forEach(k=>line.append(el('td','',plain(row?.[k]))));body.append(line)}
    table.append(body);scroll.append(table);parent.append(scroll);
    if(rows.length>500)parent.append(el('p','native-status',`Exibindo 500 de ${rows.length} registros.`));
  }
  function renderData(data){
    lastPayload=data;
    const target=panel.querySelector('.native-result');target.replaceChildren();
    if(Array.isArray(data)){target.append(el('h4','',`${data.length} registros`));renderTable(data,target);return}
    if(!data || typeof data!=='object'){target.append(el('p','native-status',plain(data)));return}
    const cards=el('div','native-cards');let shown=0;
    for(const [name,value] of Object.entries(data)){
      if(value!=null && typeof value!=='object' && shown<10){const card=el('div','native-card');card.append(el('span','',name.replaceAll('_',' ')),el('strong','',plain(value)));cards.append(card);shown++}
    }
    if(shown)target.append(cards);
    let found=false;
    for(const [name,value] of Object.entries(data)){
      if(Array.isArray(value) && value.length && typeof value[0]==='object'){
        target.append(el('h4','',name.replaceAll('_',' ')));renderTable(value,target);found=true;
      }
    }
    if(!found){const rows=Object.entries(data).filter(([,v])=>v && typeof v==='object').map(([campo,valor])=>({campo,valor:plain(valor)}));if(rows.length)renderTable(rows,target)}
  }
  async function read(){
    if(!current.path)return;
    showStatus('Consultando dados…');
    const qs=new URLSearchParams(current.fixed||{});
    panel.querySelectorAll('[data-filter]').forEach(input=>{if(input.value.trim())qs.set(input.name,input.value.trim())});
    try{
      const response=await fetch(base+current.path+(qs.size?'?'+qs:''),{credentials:'same-origin',cache:'no-store'});
      if(response.status===401){showStatus('Entre com sua conta antiga do ConcreTrack para consultar esta tela.',true);panel.querySelector('.native-login').hidden=false;return}
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.detail||payload.error||`Consulta falhou (${response.status}).`);
      panel.querySelector('.native-login').hidden=true;
      renderData(payload);showStatus('Consulta atualizada. Fonte: API de Campinas, somente leitura.');
    }catch(error){showStatus(error.message||'Falha na consulta.',true)}
  }
  async function login(event){
    event.preventDefault();const form=event.currentTarget;
    const username=form.elements.username.value,password=form.elements.password.value;
    showStatus('Validando a conta antiga…');
    try{
      const response=await fetch(base+'login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({username,password})});
      form.elements.password.value='';
      if(!response.ok)throw new Error('Não foi possível entrar com a conta antiga.');
      form.hidden=true;await read();
    }catch(error){showStatus(error.message,true)}
  }
  function csv(){
    if(!lastPayload)return;
    const data=Array.isArray(lastPayload)?lastPayload:Object.values(lastPayload).find(v=>Array.isArray(v)&&v.length&&typeof v[0]==='object');
    if(!data?.length){showStatus('Esta consulta não trouxe uma tabela para exportar.',true);return}
    const keys=[...new Set(data.flatMap(row=>Object.keys(row||{})))];
    const quote=v=>'"'+plain(v).replaceAll('"','""')+'"';
    const content='\uFEFF'+[keys.join(';'),...data.map(row=>keys.map(k=>quote(row[k])).join(';'))].join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
    const a=el('a');a.href=url;a.download=`campinas-${current.id}-${today}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function select(screen){
    current=screen;lastPayload=null;
    tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.screen===screen.id)));
    panel.replaceChildren();
    const head=el('div','native-head'),heading=el('div');heading.append(el('h3','',screen.title),el('p','',screen.description));head.append(heading);panel.append(head);
    if(!screen.path){panel.append(el('p','native-status',screen.description));return}
    const loginBox=el('form','native-login');loginBox.hidden=true;loginBox.append(el('h4','','Conta antiga do ConcreTrack'),el('p','','A consulta usa seu acesso do ERP de Campinas. A senha é enviada apenas para validação do login e não fica salva nesta página.'));
    const loginGrid=el('div','native-grid');
    for(const [name,label,type] of [['username','Usuário','text'],['password','Senha','password']]){
      const field=el('label','native-field',label),input=el('input');input.name=name;input.type=type;input.required=true;input.autocomplete=name==='password'?'current-password':'username';field.append(input);loginGrid.append(field)
    }
    loginBox.append(loginGrid);const submit=el('button','native-primary','Entrar e consultar');submit.type='submit';loginBox.append(submit);loginBox.addEventListener('submit',login);panel.append(loginBox);
    if(screen.fields?.length){const filters=el('div','native-grid');for(const field of screen.fields){const label=el('label','native-field',field.label),input=el('input');input.type=field.type;input.name=field.name;input.value=field.value;input.dataset.filter='';label.append(input);filters.append(label)}panel.append(filters)}
    const actions=el('div','native-actions');actions.append(button('Consultar','native-primary',read),button('Imprimir','native-secondary',()=>window.print()),button('Exportar CSV','native-secondary',csv));panel.append(actions);
    panel.append(el('p','native-status','Preparando consulta…'),el('div','native-result'));read();
  }
  for(const screen of list){const b=button('','native-tab',()=>select(screen)),copy=el('span','native-tab-copy');copy.append(el('strong','',screen.title),el('small','',screen.description));b.append(copy);b.dataset.screen=screen.id;b.setAttribute('role','tab');tabs.append(b)}
  select(list[0]);
})();
