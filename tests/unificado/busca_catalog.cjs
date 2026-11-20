const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function catalog(){
 const context={URL,location:{origin:'https://concrefer.concretrack.com.br:18446'},window:{},document:{currentScript:{src:'https://concrefer.concretrack.com.br:18446/unificado/shell/menu.config.js'}}};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'unificado/shell/menu.config.js'),'utf8')+'\nglobalThis.CONFIG=MENU_CONFIG;globalThis.ITEMS=MENU_ITEMS;',context);
 vm.runInContext(fs.readFileSync(path.join(root,'unificado/shell/icons.js'),'utf8'),context);
 const engine=require(path.join(root,'unificado/shell/busca.js'));
 const entries=engine.catalog(context.CONFIG,context.ITEMS,context.window.UnificadoPresentation.descriptions,()=>true,{homolog:true});
 return {engine,entries,config:context.CONFIG,items:context.ITEMS};
}
module.exports=catalog;
if(require.main===module){const {engine,entries}=catalog(),syn=JSON.parse(fs.readFileSync(path.join(root,'unificado/shell/busca-sinonimos.json'),'utf8')),index=engine.createIndex(entries,syn);console.log(JSON.stringify({size:entries.length,sample:process.argv.slice(2).map(q=>({q,first:index.search(q).results.slice(0,3).map(r=>({id:r.id,name:r.name,rank:r.rank,corrections:r.corrected}))}))},null,2));}
