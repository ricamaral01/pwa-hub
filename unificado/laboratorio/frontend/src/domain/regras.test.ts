import {describe,expect,it} from 'vitest';
import fixture from '../../../../ensaio de postes/docs/fixtures/fl-pro-22.json';
import {avaliar,avaliarInspecao,defaults,emptyInspection,inspectionItems,measurementItems,normalizarInspecao,parametros,type InspectionKey,type MeasurementKey,type Leituras,type Poste} from './regras';

describe('FL-PRO-22',()=>{
  for(const testCase of fixture.casos){
    it(`calcula ${testCase.id}`,()=>{
      const pole=testCase.poste as Poste;
      const raw=testCase.leituras;
      const readings:Leituras={e1:raw.e1,e2:{aplicavel:raw.e2.aplicavel,ok:null,fissura_mm:'',ma_daNm:''},
        e3:{flecha_mm:String(raw.e3.flecha_mm),fissura_mm:String(raw.e3.fissura_mm)},
        e4:{flecha_mm:String(raw.e4.flecha_mm),fissura_mm:String(raw.e4.fissura_mm)},
        e5:{carga_daN:String(raw.e5.carga_daN)}};
      const result=avaliar(pole,readings,undefined,testCase.inspecao_geral_ok??true);
      expect(result.veredito).toBe(testCase.esperado.veredito);
      const expected=testCase.esperado as Record<string,number|string|undefined>;
      for(const key of ['engaste_cm','carro_cm','carga_nom_daN','flecha_max_mm','carga_exc_daN','residual_max_mm','ruptura_min_daN']){
        if(typeof expected[key]==='number')expect(result.parametros[key as keyof typeof result.parametros]).toBeCloseTo(expected[key] as number,2);
      }
      for(const [fixtureKey,stepKey,resultKey] of [
        ['e3_pct_L','e3','pct_L'],['e4_pct_L','e4','pct_L'],['e5_pct_min','e5','pct_min'],
      ] as const){
        if(typeof expected[fixtureKey]==='number')expect(result.etapas[stepKey][resultKey]).toBeCloseTo(expected[fixtureKey] as number,2);
      }
      for(const stepKey of ['e3','e4','e5'] as const){
        const expectedStatus=expected[`${stepKey}_status`];
        if(typeof expectedStatus==='string')expect(result.etapas[stepKey].status).toBe(expectedStatus);
      }
    });
  }
  it('aceita vírgula decimal',()=>{
    const pole={tipo:'PL',face:'B' as const,altura_m:Number('7,5'.replace(',','.')),resistencia_daN:300};
    expect(parametros(pole).engaste_cm).toBeCloseTo(135,2);
  });
  it('usa critérios com vírgula sem alterar os resultados da planilha',()=>{
    const pole={tipo:'PL',face:'B' as const,altura_m:7.5,resistencia_daN:300};
    const criteria={...defaults,flecha_nom_pct:{...defaults.flecha_nom_pct,B:'3,5'},flecha_res_pct:{...defaults.flecha_res_pct,B:'0,35'},fissura_max_mm:'0,3',fator_excepcional:'1,4',fator_ruptura:'2,0',carro_fator:'0,30'};
    const readings:Leituras={e1:true,e2:{aplicavel:false,ok:null,fissura_mm:'',ma_daNm:''},e3:{flecha_mm:'155',fissura_mm:'0,1'},e4:{flecha_mm:'12',fissura_mm:'0'},e5:{carga_daN:'690'}};
    expect(parametros(pole,criteria).flecha_max_mm).toBeCloseTo(262.5,2);
    expect(avaliar(pole,readings,criteria).veredito).toBe('APROVADO');
    readings.e3.flecha_mm='valor inválido';
    expect(avaliar(pole,readings,criteria).veredito).toBe('EM ANDAMENTO');
    readings.e3.flecha_mm='-1';
    expect(avaliar(pole,readings,criteria).etapas.e3.status).toBe('PENDENTE');
  });
  it('calcula a inspeção dimensional no limite e reprova acima dele',()=>{
    const inspection=emptyInspection();
    for(const key of Object.keys(inspectionItems) as InspectionKey[])inspection.checklist[key]=true;
    for(const key of Object.keys(measurementItems) as MeasurementKey[])inspection.medidas[key]={min_mm:'95',max_mm:'105',leitura_mm:'100'};
    inspection.fonte_limites='Desenho aprovado DP-01';
    inspection.medidas.diametro_base={min_mm:'285',max_mm:'295',leitura_mm:'295'};
    expect(avaliarInspecao(inspection)?.medidas.diametro_base.uso_tolerancia_pct).toBe(100);
    expect(avaliarInspecao(inspection)?.status).toBe('DENTRO');
    inspection.medidas.diametro_base.leitura_mm='295,1';
    expect(avaliarInspecao(inspection)?.status).toBe('FORA');
    inspection.medidas.diametro_base.leitura_mm='290';
    inspection.fonte_limites='';
    expect(avaliarInspecao(inspection)?.status).toBe('PENDENTE');
  });
  it('preenche limites normativos e identifica modelos sem se??o parametrizada',()=>{
    const pole:Poste={tipo:'DT',face:'B',altura_m:9,resistencia_daN:300};
    const criteria={...defaults,dimensional:{fonte:'NBR 8451-2:2020',tolerancia_comprimento_mm:50,tolerancia_secao_mm:5,modelos:{'DT|9|300|B':{largura_base:392,espessura_base:290,largura_topo:140,espessura_topo:110}}}};
    const input=emptyInspection();
    for(const key of Object.keys(inspectionItems) as InspectionKey[])input.checklist[key]=true;
    input.medidas.largura_base.leitura_mm='392';
    input.medidas.largura_topo.leitura_mm='140';
    input.medidas.espessura_base.leitura_mm='295';
    input.medidas.espessura_topo.leitura_mm='110';
    const resolved=normalizarInspecao(input,pole,criteria)!;
    expect(resolved.medidas.largura_base.min_mm).toBe('387');
    expect(resolved.medidas.espessura_base.min_mm).toBe('285');
    expect(resolved.medidas.espessura_topo.max_mm).toBe('115');
    expect(avaliarInspecao(resolved)?.medidas.espessura_base.uso_tolerancia_pct).toBe(100);
    expect(avaliarInspecao(resolved)?.status).toBe('DENTRO');
    const unknown=normalizarInspecao(input,{...pole,tipo:'PL',altura_m:7.5},criteria)!;
    expect(avaliarInspecao(unknown)?.medidas.largura_base.status).toBe('N/A');
    const circularCriteria={...criteria,dimensional:{...criteria.dimensional,modelos:{...criteria.dimensional.modelos,'C|9|400|C':{largura_base:350,largura_topo:170}}}};
    const circular=normalizarInspecao(emptyInspection(),{tipo:'C',face:'C',altura_m:9,resistencia_daN:400},circularCriteria)!;
    expect(circular.medidas.diametro_base.min_mm).toBe('345');
    expect(circular.medidas.diametro_topo.max_mm).toBe('175');
    expect(circular.medidas.largura_base.aplicavel).toBe(false);
    const variants={...circularCriteria,dimensional:{...circularCriteria.dimensional,modelos:{...circularCriteria.dimensional.modelos,'C|9|400|C|A':{diametro_base:350,diametro_topo:170},'C|9|400|C|B':{diametro_base:305,diametro_topo:170}}}};
    const circularB=normalizarInspecao(emptyInspection(),{tipo:'C',face:'C',conicidade:'B',altura_m:9,resistencia_daN:400},variants)!;
    expect(circularB.medidas.diametro_base.min_mm).toBe('300');
    expect(circularB.medidas.diametro_base.max_mm).toBe('310');
    expect(circularB.medidas.diametro_topo.min_mm).toBe('165');
  });


});
