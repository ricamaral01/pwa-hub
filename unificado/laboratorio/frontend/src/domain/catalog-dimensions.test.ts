import {describe,expect,it} from 'vitest';
import {defaults,emptyInspection,modeloDoCatalogo,normalizarInspecao,type Poste} from './regras';

describe('dimensionais do catálogo',()=>{
  const criteria={...defaults,dimensional:{
    fonte:'ABNT NBR 8451-2:2020, Anexo A',tolerancia_comprimento_mm:50,
    tolerancia_secao_mm:5,tolerancia_engastamento_mm:15,
    tolerancia_furacao_mm:null,usar_nominais_modelo:true,modelos:{},
  }};

  it('mostra os limites do C 9/200 com conicidade A',()=>{
    const pole:Poste={tipo:'C',face:'C',conicidade:'A',altura_m:9,resistencia_daN:200,
      dimensoes_nominais:{diametro_topo:140,diametro_base:320}};
    const measures=normalizarInspecao(emptyInspection(),pole,criteria)!.medidas;
    expect(measures.diametro_topo).toMatchObject({nominal_mm:'140',min_mm:'135',max_mm:'145',aplicavel:true});
    expect(measures.diametro_base).toMatchObject({nominal_mm:'320',min_mm:'315',max_mm:'325',aplicavel:true});
    expect(measures.engastamento.aplicavel).toBe(false);
  });

  it('usa o diâmetro da base da conicidade B',()=>{
    const pole:Poste={tipo:'C',face:'C',conicidade:'B',altura_m:9,resistencia_daN:200,
      dimensoes_nominais:{diametro_topo:140,diametro_base:275}};
    expect(normalizarInspecao(emptyInspection(),pole,criteria)!.medidas.diametro_base)
      .toMatchObject({nominal_mm:'275',min_mm:'270',max_mm:'280',aplicavel:true});
  });

  it('identifica o modelo quando tipo, altura e resistência são preenchidos manualmente',()=>{
    const catalog=[
      {id:'a',tipo:'C',face:'C' as const,conicidade:'A' as const,altura_m:9,resistencia_daN:300,dimensoes_nominais:{diametro_topo:170,diametro_base:350}},
      {id:'b',tipo:'C',face:'C' as const,conicidade:'B' as const,altura_m:9,resistencia_daN:300,dimensoes_nominais:{diametro_topo:170,diametro_base:305}},
    ];
    const pole:Poste={tipo:'C',face:'C',conicidade:'A',altura_m:9,resistencia_daN:300};
    const model=modeloDoCatalogo(catalog,pole);
    expect(model?.id).toBe('a');
    expect(normalizarInspecao(emptyInspection(),{...pole,dimensoes_nominais:model?.dimensoes_nominais},criteria)!.medidas.diametro_base)
      .toMatchObject({nominal_mm:'350',min_mm:'345',max_mm:'355',aplicavel:true});
    expect(modeloDoCatalogo(catalog,{...pole,resistencia_daN:250})).toBeNull();
    expect(modeloDoCatalogo([...catalog,catalog[0]],pole)).toBeNull();
  });
});
