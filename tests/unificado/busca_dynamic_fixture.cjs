// Recorded authorized production menu, not a fabricated permission grant.
const data=require('../../docs/revisao-visual-unificado/producao-20261120/retomada/armacao-production.json');
module.exports=()=>{const actor=data.find(row=>row.account==='alex');return actor.menu.map(row=>{
 const [unit,tab]=row.key.split('|'),name=row.label,alias=name==='Fechamento do dia';
 return {id:`armacao-${unit}-${alias?'fechamento':tab}`,name,description:'',module:'Produção',moduleId:'producao',unit:actor.api.units.find(u=>u.codigo===unit).nome,group:'Armação',url:row.href};
});};
