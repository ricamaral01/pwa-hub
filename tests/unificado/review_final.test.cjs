const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('daily report source captions preserve unavailable states without implementation details',()=>{
 const source=fs.readFileSync(path.join(root,'unificado/relatorios/fechamento-diario/index.html'),'utf8');
 const helper=source.slice(source.indexOf('    function statusLabel(src)'),source.indexOf('    function renderSources'));
 const context={};vm.runInNewContext(helper,context);
 assert.equal(context.statusLabel(null),'Situação não informada');
 assert.equal(context.statusLabel({status:'ok'}),'Dados disponíveis');
 assert.equal(context.statusLabel({status:'ok',erro:'credencial_google_nao_encontrada'}),'Dados indisponíveis neste ambiente');
 assert.equal(context.statusLabel({status:'parcial'}),'Dados parciais');
});
test('Modelo A absorption alias uses the existing canonical route and permission',()=>{
 const s=fs.readFileSync(path.join(root,'unificado/shell/router.js'),'utf8');
 const functions=s.slice(s.indexOf('  function resolve(value)'),s.indexOf('  function deny('));
 const items={labAbsorption:{module:'laboratorio',url:'https://concrefer.concretrack.com.br:18446/unificado/laboratorio/novo/absorcao'},labTests:{module:'laboratorio',url:'https://concrefer.concretrack.com.br:18446/unificado/laboratorio/novo/postes?tab=historico'}};
 const context={URL,root:'/unificado/',location:{origin:'https://concrefer.concretrack.com.br:18446',href:'https://concrefer.concretrack.com.br:18446/unificado/'},MENU_ITEMS:items,hasMapa:true,mapaUser:{role:'GERENCIA'},window:{UnificadoScreenAccess:{allowed:()=>false}}};
 vm.runInNewContext(functions,context);
 const route=context.resolve('/unificado/laboratorio/novo/postes?tab=absorcao');
 assert.equal(route.url.href,items.labAbsorption.url);
 assert.equal(context.screenFor(route),'labAbsorption');
 assert.equal(context.resolve('/unificado/laboratorio/novo/postes?tab=historico').url.search,'?tab=historico');
});
test('Noroeste metrics display Portuguese numbers without changing input values',()=>{
 const source=fs.readFileSync(path.join(root,'unificado/usinas/noroeste/noro-native.js'),'utf8');
 const helper=source.match(/function card\(title,value,sub=''\) \{[\s\S]*?\n\}/)[0];
 const el=(tag,text='',className='')=>({tag,text,children:[],append(...children){this.children.push(...children);}});
 const context={el};vm.runInNewContext(source.slice(source.indexOf('const number ='),source.indexOf('const displayDate ='))+helper,context);
 assert.equal(context.card('Média',22.79).children[1].text,'22,79');
 assert.equal(context.card('Leituras',1000).children[1].text,'1.000');
 assert.equal(context.card('Volume','0 m³').children[1].text,'0 m³');
});
test('native Usinas subroutes keep their actual title in mobile navigation',()=>{
 const source=fs.readFileSync(path.join(root,'unificado/shell/icons.js'),'utf8');
 const helper=source.slice(source.indexOf(' function routeTitle(view)'),source.indexOf(' window.UnificadoPresentation='));
 const context={URL};vm.runInNewContext(helper,context);
 assert.equal(context.routeTitle('usinas/?area=relatorios&app=consumo'),'Consumo de materiais');
 assert.equal(context.routeTitle('usinas/?area=estoque&app=saldo'),'Saldo de estoque');
 assert.equal(context.routeTitle('usinas/?area=cec&app=leitura'),'Leitura de CP');
 assert.equal(context.routeTitle('usinas/?area=cec'),'Controle estatístico');
 assert.equal(context.routeTitle('usinas/?area=cec&app=unknown'),null);
 assert.equal(context.routeTitle('pcp/dashboard/'),null);
});
test('home widget does not query hidden data behind module routes',()=>{
 const s=fs.readFileSync(path.join(root,'unificado/shell/shell.js'),'utf8');
 const helper=s.match(/function shouldLoadSectorData\(search = location.search\) \{[\s\S]*?\n\}/)[0];
 const c={URLSearchParams};vm.runInNewContext(helper,c);
 assert.equal(c.shouldLoadSectorData(''),true);
 assert.equal(c.shouldLoadSectorData('?view=pcp%2Fdashboard%2F'),false);
 assert.equal(c.shouldLoadSectorData('?module=laboratorio'),false);
 assert.equal(c.shouldLoadSectorData('?source=bookmark'),true);
});
test('integer chart ticks stay distinct for empty, tiny and large series',()=>{
 const window={};vm.runInNewContext(fs.readFileSync(path.join(root,'unificado/producao/indicadores-gerais/presentation.js'),'utf8'),{window});
 for(const maximum of [0,1,2,3,4,11,100,1051,1000000]){
  const ticks=Array.from(window.IndicatorPresentation.axisTicks(maximum));
  assert.equal(new Set(ticks).size,ticks.length);
  assert.ok(ticks.every(Number.isInteger));assert.ok(ticks.at(-1)>=maximum);
 }
 assert.equal(window.IndicatorPresentation.plural(1,'poste','postes'),'1 poste');
 assert.equal(window.IndicatorPresentation.plural(2,'dia incompleto','dias incompletos'),'2 dias incompletos');
});
test('sentence case preserves proper names, abbreviations and Portuguese titles',()=>{
 const s=fs.readFileSync(path.join(root,'unificado/shell/components.js'),'utf8');
 const window={};vm.runInNewContext(s.slice(s.indexOf('  const acronyms='),s.indexOf('  function presentation()')),{window});
 for(const [input,expected] of [
  ['Mapeamento cobli','Mapeamento Cobli'],['Apontamento mega','Apontamento Mega'],
  ['Etiquetas armaduras - postes sc','Etiquetas armaduras - postes SC'],
  ['PROGRAMAÇÃO FINAL','Programação final'],['Producao realizada -- banco local','Produção realizada'],
  ['Vol. (m3)','Vol. (m³)'],['concretrack erp pcp cnpj epi rh iqf','ConcreTrack ERP PCP CNPJ EPI RH IQF']
 ])assert.equal(window.UnificadoSentence(input),expected);
 assert.equal(window.UnificadoPluralText('1 pessoa(s) · 2 dia(s) · 1 postes'),'1 pessoa · 2 dias · 1 poste');
 assert.equal(window.UnificadoSentence('\n  Producao realizada -- banco local'),'\n  Produção realizada');
 assert.equal(window.UnificadoSentence('Postes (sc)'),'Postes (SC)');
 assert.equal(window.UnificadoSentence('FL-SGQ-07 · resistencia em mpa'),'FL-SGQ-07 · resistencia em MPa');
 assert.equal(window.UnificadoSentence('SC01 DTB10 CP-2026/01'),'SC01 DTB10 CP-2026/01');
 assert.equal(window.UnificadoPluralText('1.10 m3 · 1.234 m³'),'1,10 m³ · 1.234 m³');
 assert.equal(window.UnificadoPluralText('1 dia(s) incompleto(s) · 2 dia(s) incompleto(s)'),'1 dia incompleto · 2 dias incompletos');
 assert.equal(window.UnificadoPluralText('2 homem(s) · 2 solicitação(s)'),'2 homens · 2 solicitações');
 assert.equal(window.UnificadoPluralText('1.1 postes · 11 postes · 1 postes'),'1.1 postes · 11 postes · 1 poste');
 assert.equal(window.UnificadoSentence('1 DIA(S) INCOMPLETO(S)'),'1 dia incompleto');
});
