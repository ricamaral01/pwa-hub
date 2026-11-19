const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
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
 assert.equal(window.UnificadoPluralText('1.10 m3 · 1.234 m³'),'1,10 m³ · 1.234 m³');
});
