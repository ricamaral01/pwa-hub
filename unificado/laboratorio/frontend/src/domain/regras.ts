export type Face='A'|'B'|'C';
export type Poste={tipo:string;face:Face;conicidade?:'A'|'B';altura_m:number;resistencia_daN:number;ma_daNm?:number|null;descricao?:string;norma_parte?:string;dimensoes_nominais?:Partial<Record<MeasurementKey,number|null>>};
export function modeloDoCatalogo<T extends Poste&{id:string}>(catalogo:T[],poste:Poste):T|null{
  const matches=catalogo.filter(modelo=>modelo.tipo.toUpperCase()===poste.tipo.toUpperCase()&&
    Number(modelo.altura_m)===Number(poste.altura_m)&&Number(modelo.resistencia_daN)===Number(poste.resistencia_daN)&&
    (modelo.conicidade||'A')===(poste.conicidade||'A')&&
    (modelo.face===poste.face||(modelo.tipo.toUpperCase()==='DT'&&modelo.face==='B'&&poste.face==='A')));
  return matches.length===1?matches[0]:null;
}
export type Leituras={e1:boolean;e2:{aplicavel:boolean;ok:boolean|null;fissura_mm:string;ma_daNm:string};e3:{flecha_mm:string;fissura_mm:string};e4:{flecha_mm:string;fissura_mm:string};e5:{carga_daN:string}};
export const inspectionItems={identificacao:'Identificação e marcação legíveis',acabamento:'Acabamento e superfície íntegros',armadura:'Sem armadura exposta',fissuras:'Sem fissuras ou danos visíveis',furos:'Furos e acessórios conformes'} as const;
export const measurementItems={largura_base:'Face A · base',largura_topo:'Face A · topo',espessura_base:'Face B · base',espessura_topo:'Face B · topo',diametro_base:'Diâmetro da base',diametro_topo:'Diâmetro do topo',engastamento:'Engastamento (e)',furacao_f:'Cota de furação F',furacao_j:'Cota de furação J'} as const;
export type InspectionKey=keyof typeof inspectionItems;
export type MeasurementKey=keyof typeof measurementItems;
export type Measurement={nominal_mm?:string;min_mm:string;max_mm:string;leitura_mm:string;aplicavel?:boolean|null};
export type Inspection={checklist:Record<InspectionKey,boolean|null>;medidas:Record<MeasurementKey,Measurement>;fonte_limites:string};
export const emptyInspection=():Inspection=>({checklist:Object.fromEntries(Object.keys(inspectionItems).map(key=>[key,null])) as Inspection['checklist'],medidas:Object.fromEntries(Object.keys(measurementItems).map(key=>[key,{min_mm:'',max_mm:'',leitura_mm:''}])) as Inspection['medidas'],fonte_limites:''});
export type Dimensional={fonte:string;tolerancia_comprimento_mm:number|string;tolerancia_secao_mm:number|string;tolerancia_engastamento_mm?:number|string|null;tolerancia_furacao_mm?:number|string|null;usar_nominais_modelo?:boolean;grounding?:Record<string,Record<string,[number,number,number]>>;modelos:Record<string,Partial<Record<'largura_base'|'espessura_base'|'largura_topo'|'espessura_topo'|'diametro_base'|'diametro_topo',number>>>};
export type Criteria={flecha_nom_pct:Record<Face,number|string>;flecha_res_pct:Record<Face,number|string>;fissura_max_mm:number|string;fator_excepcional:number|string;fator_ruptura:number|string;carro_fator:number|string;absorcao_media_max_pct:number|string;absorcao_ind_max_pct:number|string;validade_calibracao_meses:number;dimensional?:Dimensional};
export const defaults:Criteria={flecha_nom_pct:{A:5,B:3.5,C:3.5},flecha_res_pct:{A:.5,B:.35,C:.35},fissura_max_mm:.3,fator_excepcional:1.4,fator_ruptura:2,carro_fator:.3,absorcao_media_max_pct:5.5,absorcao_ind_max_pct:7,validade_calibracao_meses:12};
export const number=(v:unknown):number|null=>{if(v===null||v===undefined||String(v).trim()==='')return null;const parsed=Number(String(v).trim().replace(',','.'));return Number.isFinite(parsed)&&parsed>=0?parsed:null};
export function referenciaPoste(p:Poste,c:Criteria){
  const tipo=p.tipo.toUpperCase()==='R'?'C':p.tipo.toUpperCase(),height=Number(p.altura_m),load=Number(p.resistencia_daN);
  if(!Number.isFinite(height)||height<=0||!Number.isFinite(load)||load<=0)return null;
  if(tipo!=='C'&&tipo!=='DT')return null;
  const base=`${tipo}|${height}|${load}|${tipo==='C'?'C':'B'}`;
  const model=tipo==='C'?(c.dimensional?.modelos[`${base}|${p.conicidade||'A'}`]||(p.conicidade==='B'?undefined:c.dimensional?.modelos[base])):c.dimensional?.modelos[base];
  if(!model)return null;
  const grounding=c.dimensional?.grounding?.[tipo]?.[String(height)];
  return{model,grounding,source:c.dimensional?.fonte||'ABNT NBR 8451-2:2020, Anexo A',conicity:tipo==='C'?(p.conicidade==='B'?15:20):null};
}
export function normalizarInspecao(i:Inspection|null,p:Poste,c:Criteria):Inspection|null{
  if(!i||!c.dimensional)return i;
  const dim=c.dimensional,sectionTol=number(dim.tolerancia_secao_mm);
  const section=p.tipo.toUpperCase()==='R'?'C':p.tipo.toUpperCase();
  const key=`${section}|${Number(p.altura_m)}|${Number(p.resistencia_daN)}|${p.face}`;
  const circular=section==='C',variant=p.conicidade||'A';
  const model=circular?(dim.modelos[`${key}|${variant}`]||(variant==='A'?dim.modelos[key]:undefined)||{}):(dim.modelos[key]||dim.modelos[`${p.tipo.toUpperCase()}|${Number(p.altura_m)}|${Number(p.resistencia_daN)}|B`]||{});
  const medidas=Object.fromEntries((Object.keys(measurementItems) as MeasurementKey[]).map(name=>{
    if(dim.usar_nominais_modelo){
      const shape=name==='engastamento'||name==='furacao_f'||name==='furacao_j'||(circular?name.startsWith('diametro_'):!name.startsWith('diametro_'));
      const nominal=shape?number(p.dimensoes_nominais?.[name]):null;
      const tol=name==='engastamento'?number(dim.tolerancia_engastamento_mm):name==='furacao_f'||name==='furacao_j'?number(dim.tolerancia_furacao_mm):sectionTol;
      const hasLimit=nominal!==null&&tol!==null;
      return[name,{nominal_mm:nominal===null?'':String(nominal),min_mm:hasLimit?String(nominal-tol):'',max_mm:hasLimit?String(nominal+tol):'',leitura_mm:i.medidas[name]?.leitura_mm||'',aplicavel:hasLimit}];
    }
    if(name==='engastamento'||name==='furacao_f'||name==='furacao_j'){
      const ground=dim.grounding?.[circular?'C':'DT']?.[String(Number(p.altura_m))];
      const index=name==='furacao_f'?0:name==='furacao_j'?1:2;
      const nominal=model&&ground?number(ground[index]):null;
      const tol=name==='engastamento'?number(dim.tolerancia_engastamento_mm):number(dim.tolerancia_furacao_mm);
      const hasLimit=nominal!==null&&tol!==null;
      return[name,{nominal_mm:nominal===null?'':String(nominal),min_mm:hasLimit?String(nominal-tol):'',max_mm:hasLimit?String(nominal+tol):'',leitura_mm:i.medidas[name]?.leitura_mm||'',aplicavel:hasLimit}];
    }
    const applicableShape=circular?name.startsWith('diametro_'):!name.startsWith('diametro_');
    const nominal=applicableShape?number(model[name as keyof typeof model]??(circular?model[name.replace('diametro_','largura_') as keyof typeof model]:undefined)):null;
    const hasLimit=nominal!==null&&sectionTol!==null;
    const legacy=name.startsWith('espessura_')&&p.face==='B'?name.replace('espessura_','diametro_'):name.startsWith('largura_')&&p.face==='A'?name.replace('largura_','diametro_'):name;
    return[name,{nominal_mm:nominal===null?'':String(nominal),min_mm:hasLimit?String(nominal-sectionTol):'',max_mm:hasLimit?String(nominal+sectionTol):'',leitura_mm:i.medidas[name]?.leitura_mm||i.medidas[legacy as MeasurementKey]?.leitura_mm||'',aplicavel:hasLimit}];
  })) as Inspection['medidas'];
  const source=p.tipo.toUpperCase()==='PL'?'Seção sem modelo correspondente na tabela dimensional cadastrada (N/A)':dim.fonte;
  return{checklist:i.checklist,medidas,fonte_limites:source};
}
export function parametros(p:Poste,c:Criteria=defaults){const L=number(p.altura_m)??0,R=number(p.resistencia_daN)??0,nom=number(c.flecha_nom_pct[p.face])??0,res=number(c.flecha_res_pct[p.face])??0;return{engaste_cm:(L*.1+.6)*100,carro_cm:L*(number(c.carro_fator)??0)*100,carga_nom_daN:R,flecha_max_mm:L*1000*nom/100,carga_exc_daN:R*(number(c.fator_excepcional)??0),residual_max_mm:L*1000*res/100,ruptura_min_daN:R*(number(c.fator_ruptura)??0),flecha_nom_pct:nom,flecha_res_pct:res};}
type Status='DENTRO'|'FORA'|'PENDENTE'|'N/A';
type Step={status:Status;valor_mm?:number;valor_daN?:number;limite_mm?:number;limite_daN?:number;fissura_mm?:number|null;pct_L?:number;uso_pct?:number;pct_min?:number;vezes_nominal?:number};
export function avaliarInspecao(i:Inspection|null){if(!i)return null;const checklist=Object.fromEntries((Object.keys(inspectionItems) as InspectionKey[]).map(key=>[key,i.checklist[key]===true?'DENTRO':i.checklist[key]===false?'FORA':'PENDENTE'])) as Record<InspectionKey,Status>;
  const medidas=Object.fromEntries((Object.keys(measurementItems) as MeasurementKey[]).map(key=>{const raw=i.medidas[key];if(!raw||raw.aplicavel===false)return[key,{status:'N/A' as Status,min_mm:null,max_mm:null,leitura_mm:null,uso_tolerancia_pct:null}];const min=number(raw.min_mm),max=number(raw.max_mm),reading=number(raw.leitura_mm);const valid=min!==null&&max!==null&&reading!==null&&max>min;const status:Status=!valid?'PENDENTE':reading<min||reading>max?'FORA':'DENTRO';const usage=valid?Math.abs(reading-(min+max)/2)/((max-min)/2)*100:null;return[key,{status,min_mm:min,max_mm:max,leitura_mm:reading,uso_tolerancia_pct:usage}]})) as Record<MeasurementKey,{status:Status;min_mm:number|null;max_mm:number|null;leitura_mm:number|null;uso_tolerancia_pct:number|null}>;
  const statuses=[...Object.values(checklist),...Object.values(medidas).map(v=>v.status),...(i.fonte_limites.trim()?[]:['PENDENTE' as Status])];return{checklist,medidas,status:statuses.includes('FORA')?'FORA' as Status:statuses.includes('PENDENTE')?'PENDENTE' as Status:'DENTRO' as Status};}
export function avaliar(p:Poste,l:Leituras,c:Criteria=defaults,inspecao=true,inspection:Inspection|null=null){const par=parametros(p,c),steps:Record<string,Step>={},fissLimit=number(c.fissura_max_mm)??0;steps.e1={status:l.e1?'DENTRO':'PENDENTE'};const f2=number(l.e2.fissura_mm),ma=number(l.e2.ma_daNm);steps.e2=!l.e2.aplicavel?{status:'N/A'}:{status:l.e2.ok===false||f2!==null&&f2>fissLimit?'FORA':l.e2.ok===null||f2===null||ma===null?'PENDENTE':'DENTRO',fissura_mm:f2};
  for(const [key,limit] of [['e3',par.flecha_max_mm],['e4',par.residual_max_mm]] as const){const reading=l[key],value=number(reading.flecha_mm),fiss=number(reading.fissura_mm);steps[key]=value===null?{status:'PENDENTE'}:{status:value>limit||fiss!==null&&fiss>fissLimit?'FORA':fiss===null?'PENDENTE':'DENTRO',valor_mm:value,limite_mm:limit,fissura_mm:fiss,pct_L:value/(p.altura_m*1000)*100,uso_pct:value/limit*100};}
  const rupture=number(l.e5.carga_daN);steps.e5=rupture===null?{status:'PENDENTE'}:{status:rupture>=par.ruptura_min_daN?'DENTRO':'FORA',valor_daN:rupture,limite_daN:par.ruptura_min_daN,pct_min:rupture/par.ruptura_min_daN*100,vezes_nominal:rupture/par.carga_nom_daN};const checked=avaliarInspecao(inspection),states=[...Object.values(steps).map(s=>s.status),...(checked?[checked.status]:[])];const veredito=(!checked&&!inspecao)||states.includes('FORA')?'REPROVADO':states.includes('PENDENTE')?'EM ANDAMENTO':'APROVADO';return{etapas:steps,inspecao:checked,veredito,parametros:par};}
