/* Cross-check the previous inventory against actual shell destinations. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'docs/revisao-visual-unificado/homolog/revisao-final');
const previous=JSON.parse(fs.readFileSync(path.join(out,'../revisao-completa/inventario.json'),'utf8'));
const context={URL,window:{},document:{currentScript:{src:'https://concrefer.concretrack.com.br:18446/unificado/shell/menu.config.js'}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'unificado/shell/menu.config.js'),'utf8')+';this.items=MENU_ITEMS;',context);
const added=[],inventory=previous.map(row=>{
 const current={...row,label:context.items[row.id]?.label||row.label};
 if(row.id==='tvFormas')return {...current,direct:true,coverage_correction:'Dedicated TV page was previously sent to the shell, which has no TV route.'};
 if(row.id==='layoutFormasS4')return {...current,steps:[{frame_path:'/mapa/operacao/',selector:'.s4-dt-edit'}],coverage_correction:'The editor is a dialog opened from Setor 4; the old capture only showed its parent page.'};
 return current;
});
for(const item of Object.values(context.items)){
 const u=new URL(item.url);
 if(previous.some(row=>row.id===item.id&&row.path+(row.query||'')===u.pathname+u.search+u.hash))continue;
 const existing=previous.find(row=>row.id===item.id);
 const row={id:existing?'route-'+item.id:item.id,module:item.module,label:item.label,path:u.pathname,query:u.search+u.hash,access_screen:item.permissionId||existing?.access_screen||item.id,source:'shell/menu.config.js'};
 if(!existing||existing.path+(existing.query||'')!==u.pathname+u.search){inventory.push(row);added.push(row);}
}
const nativeSource=fs.readFileSync(path.join(root,'unificado/usinas/native-areas.js'),'utf8');
const screenLiteral=nativeSource.slice(nativeSource.indexOf('const screens = {')+'const screens = '.length,nativeSource.indexOf('  const list = screens[key]')).trim().replace(/;$/,'');
const nativeContext={};vm.runInNewContext('const D=(...args)=>args;this.screens='+screenLiteral,nativeContext);
const cecSource=fs.readFileSync(path.join(root,'unificado/usinas/cec-native.js'),'utf8');
const cecTabs=[...cecSource.matchAll(/\['([^']+)'\s*,\s*'([^']+)'\s*,\s*'[^']+'\]/g)].map(m=>({id:m[1],title:m[2]}));
for(const [area,screens] of Object.entries({relatorios:nativeContext.screens.relatorios,estoque:nativeContext.screens.estoque,cec:cecTabs})){
 const menuId={relatorios:'usinasRelatorios',estoque:'usinasEstoque',cec:'usinasCec'}[area];
 const permission=context.items[menuId]?.permissionId||menuId;
 for(const screen of screens){
  const row={id:`usinas-${area}-${screen.id}`,module:'usinas',label:screen.title,path:'/unificado/usinas/',query:`?area=${area}&app=${screen.id}`,access_screen:permission,source:area==='cec'?'usinas/cec-native.js':'usinas/native-areas.js'};
  if(!inventory.some(r=>r.path+(r.query||'')===row.path+row.query)){inventory.push(row);added.push(row);}
 }
}
for(const [parent,attribute,values] of [['inspecao','data-ins-tab',['analise','postes','producao']],['dashMontagem','data-tab',['producao','qualidade','produtividade']]]){
 const definition=inventory.find(row=>row.id===parent);
 for(const value of values){const row={...definition,id:parent+'-tab-'+value,label:definition.label+' · '+value,access_screen:parent,steps:[{frame_path:'/mapa/operacao/',selector:`[${attribute}="${value}"]`}],source:'mapa/operacao/index.html'};if(parent==='dashMontagem'){row.inactive=true;row.inactive_reason='Controles legados .mi-tab-btn ficam ocultos no dashboard montado atual. Concretagem, Montagem e Defeitos são destinos ativos separados, já inventariados. Evidência: diagnosticos/scan-before-final-gerencia.json e matriz inicial com Locator.click: element is not visible.';}inventory.push(row);added.push(row);}
}
for(const [parent,selector,values,frame] of [
 ['cronoanalise.simular','.cr-tabs button',['Sequências','Layout','Tempos','Histórico'],'/cronoanalise/'],
 ['postesNumerosSerie','[data-series-view]',['Produção e rastreabilidade','Saldos anuais'],'/pcp/numeros-serie/']
]){
 const definition=inventory.find(row=>row.id===parent);
 values.forEach((label,index)=>{const row={...definition,id:parent+'-tab-'+(index+1),label:definition.label+' · '+label,access_screen:parent,steps:[{frame_path:frame,selector,text:label}],source:parent.startsWith('crono')?'laboratorio/frontend/src/cronoanalise/Pages.tsx':'pcp/numeros-serie/index.html'};inventory.push(row);added.push(row);});
}
const source=fs.readFileSync(path.join(root,'unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts'),'utf8');
const modeloRoutes=[];
for(const match of source.matchAll(/\['([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'[^']+'/g)){
 const [,id,label,route]=match;if(!route.includes('/'))continue;
 modeloRoutes.push({id,label,route});
 const u=new URL(route,'https://concrefer.concretrack.com.br:18446/unificado/');
 if(inventory.some(row=>row.path+(row.query||'')===u.pathname+u.search))continue;
 const parent=Object.values(context.items).find(item=>item.id===id);if(!parent)continue;
 const row={id:'modelo-'+id,module:parent.module,label,path:u.pathname,query:u.search,access_screen:parent.permissionId||id,source:'sidebar-modelo-a/src/components/sidebar/navConfig.ts'};
 inventory.push(row);added.push(row);
}
const seenIds=new Map();
for(const row of inventory){const count=(seenIds.get(row.id)||0)+1;seenIds.set(row.id,count);if(count>1){row.access_screen=row.access_screen||row.id;row.id+='-variant-'+count;}}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'inventario.json'),JSON.stringify(inventory,null,2));
fs.writeFileSync(path.join(out,'controles-inativos.json'),JSON.stringify(inventory.filter(row=>row.inactive),null,2));
fs.writeFileSync(path.join(out,'rotas-adicionadas.json'),JSON.stringify({previous:previous.length,current:inventory.length,added,modelo_routes: modeloRoutes,indicator_omission:'The prior catalog-based inventory did not expand menu aliases with permissionId. indicadorGeralProducao uses the existing produtividade permission; its destination must be reviewed separately.'},null,2));
console.log(JSON.stringify({previous:previous.length,current:inventory.length,added:added.map(r=>r.id)}));
