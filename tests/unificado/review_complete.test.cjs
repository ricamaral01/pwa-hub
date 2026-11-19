const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'unificado/shell/icons.js'),'utf8'),sandbox);
const {resolveEntry}=sandbox.window.UnificadoPresentation;
const entries=[{item:{id:'series',url:'pcp/numeros-serie/'}},{item:{id:'mapS3',url:'mapa/?tela=S3'}},{item:{id:'mapS4',url:'mapa/?tela=S4'}}];
const view=e=>e.url;
test('route id disambiguates parameter routes opened through shortcuts',()=>{
 assert.equal(resolveEntry(entries,'pcp/numeros-serie/?semana=2026-11-16','series',view).item.id,'series');
 assert.equal(resolveEntry(entries,'mapa/?tela=S4','mapS3',view).item.id,'mapS4');
});
test('path fallback never chooses another parameter-specific screen',()=>{
 assert.equal(resolveEntry(entries,'mapa/?tela=OTHER',null,view),null);
 assert.equal(resolveEntry(entries,'pcp/numeros-serie/?data=2026-11-18',null,view).item.id,'series');
});
test('screen types use distinct icons and unknown types have no invented icon',()=>{
 const f=sandbox.window.UnificadoIcons.forScreen;
 assert.equal(f({id:'dashboard'}),'grafico');assert.equal(f({id:'programacao12'}),'calendario');
 assert.equal(f({id:'armadurasRelatorio'}),'documento');assert.equal(f({id:'etiquetas'}),'etiqueta');
 assert.equal(f({id:'labLeitura'}),'leitor');assert.equal(f({label:'QR'}),'qr');
 assert.equal(f({id:'postesNumerosSerie'}),'lista');assert.equal(f({id:'unknown'}),'');
});
test('dashboard without programming has no percentage or danger tone',()=>{
 const s=fs.readFileSync(path.join(root,'unificado/pcp/dashboard/index.html'),'utf8');
 const ctx={};vm.runInNewContext(s.match(/function pct\(v\) \{[\s\S]*?\n\}/)[0]+'\n'+s.match(/function achievementTone\(v\) \{[\s\S]*?\n\}/)[0],ctx);
 assert.equal(ctx.pct(null),'—');assert.equal(ctx.achievementTone(null),'');assert.equal(ctx.pct(12.5),'12,5%');
 assert.match(s,/Number\(data.total_programado_m3\)>0\?data.eficiencia_geral_pct:null/);
});
test('service worker revalidates generated GED CSS and leaves APIs alone',()=>{
 const handlers={};const calls=[];let response;
 const context={URL,Promise,self:{location:{origin:'https://concrefer.concretrack.com.br:18446'},addEventListener:(name,fn)=>handlers[name]=fn},fetch:(request,options)=>{calls.push({request,options});return Promise.resolve({ok:true})}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'unificado/sw.js'),'utf8'),context);
 handlers.fetch({request:{method:'GET',url:context.self.location.origin+'/unificado/ged/_next/static/chunks/published.css'},respondWith:p=>response=p});
 assert.equal(calls.length,1);assert.equal(calls[0].options.cache,'no-store');assert.ok(response);
 calls.length=0;response=null;
 handlers.fetch({request:{method:'GET',url:context.self.location.origin+'/unificado/ged/api/documents'},respondWith:p=>response=p});
 assert.equal(calls.length,0);assert.equal(response,null);
});
test('supply panel renders zero late approvals and a singular urgent request',async()=>{
 const source=fs.readFileSync(path.join(root,'unificado/suprimentos/frontend/app.js'),'utf8');
 const panel=source.slice(source.indexOf('async function loadPanel()'),source.indexOf('function tableRows('));
 const context={state:{me:{flags:{}},rows:[]},app:{innerHTML:''},header:()=>'',path:x=>'/'+x,tableRows:()=>'',api:async url=>url.startsWith('/solicitacoes')?{items:[{status:'EM_ATENDIMENTO',urgencia:'URGENTE'}]}:{aprovar:[]}};
 vm.runInNewContext(panel,context);await context.loadPanel();
 assert.match(context.app.innerHTML,/Nenhuma há mais de 24 h/);assert.match(context.app.innerHTML,/1 urgente · parou produção/);
 assert.doesNotMatch(context.app.innerHTML,/1 urgentes|0 há mais/);
});
