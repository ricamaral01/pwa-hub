import { describe, expect, it } from 'vitest';
import { parseNumero } from '../../src/core/units';
import { validarTraco } from '../../src/core/validate';
import { calcularTraco } from '../../src/core/calc/metodoManual';
import { corrigirUmidade } from '../../src/core/calc/umidade';
import type { Traco } from '../../src/core/model';
const now='2026-10-17T00:00:00Z';
function traco():Traco { return {id:'t1',codigo:'',nome:'C40',unidade:'campinas',versao:0,revisao:0,status:'rascunho',metodo:'manual',objetivo:{fckMPa:40,sdMPa:4,classe:'III',estrutura:'armado',abatimentoMm:100,toleranciaMm:20},arIncorporadoPct:1.5,normalizarPara1m3:false,experimentais:[],auditoria:{criadoPor:'teste',criadoEm:now,alteradoPor:'teste',alteradoEm:now},itens:[
  {id:'c',nome:'Cimento',categoria:'cimento',massaKgM3:350,massaEspecificaKgDm3:3.12,custoRsKg:0.7},
  {id:'ad',nome:'Adição',categoria:'adicao',massaKgM3:50,massaEspecificaKgDm3:2.7},
  {id:'an1',nome:'Areia 1',categoria:'areia',massaKgM3:400,massaEspecificaKgDm3:2.6,umidadeLivrePct:2},
  {id:'an2',nome:'Areia 2',categoria:'areia',massaKgM3:100,massaEspecificaKgDm3:2.5,umidadeLivrePct:4},
  {id:'b',nome:'Brita',categoria:'brita',massaKgM3:900,massaEspecificaKgDm3:2.7},
  {id:'w',nome:'Água',categoria:'agua',massaKgM3:175,massaEspecificaKgDm3:1},
  {id:'a1',nome:'Aditivo 1',categoria:'aditivo',massaKgM3:3,massaEspecificaKgDm3:1.1},
  {id:'a2',nome:'Aditivo 2',categoria:'aditivo',massaKgM3:4,massaEspecificaKgDm3:1.2}
]}; }
describe('núcleo único',()=>{
  it('interpreta valores pt-BR e rejeita vazios',()=>{expect(parseNumero('1.234,5')).toBe(1234.5);expect(parseNumero('1234,5')).toBe(1234.5);expect(parseNumero('1234.5')).toBe(1234.5);expect(parseNumero('')).toBeNull();expect(parseNumero('abc')).toBeNull()});
  it('distingue a/c de a/agl e preserva segunda areia e segundo aditivo',()=>{const r=calcularTraco(traco())!;expect(r.relacaoAguaCimento).toBeCloseTo(.5,8);expect(r.relacaoAguaAglomerante).toBeCloseTo(.4375,8);expect(r.itens.find(i=>i.id==='an2')?.volumeL).toBeCloseTo(40,8);expect(r.itens.find(i=>i.id==='a2')?.volumeL).toBeCloseTo(4/1.2,8);expect(r.fcjMPa).toBeCloseTo(46.6,8)});
  it('corrige umidades distintas e água de obra',()=>{const r=calcularTraco(traco())!;const c=corrigirUmidade(r.itens);expect(c.itens.find(i=>i.id==='an1')?.aguaAgregadoKgM3).toBe(8);expect(c.itens.find(i=>i.id==='an2')?.aguaAgregadoKgM3).toBe(4);expect(c.aguaObraKgM3).toBe(163)});
  it('bloqueia água de obra negativa',()=>{const t=traco();t.itens[2].umidadeLivrePct=50;expect(validarTraco(t).some(x=>x.campo==='aguaObra')).toBe(true);expect(calcularTraco(t)).toBeNull()});
  it('não calcula valores inválidos',()=>{const t=traco();t.itens[0].massaKgM3=0;expect(validarTraco(t).some(x=>x.nivel==='erro')).toBe(true);expect(calcularTraco(t)).toBeNull();t.itens[0].massaKgM3=350;t.itens[1].massaEspecificaKgDm3=0;expect(calcularTraco(t)).toBeNull()});
  it('aditivo percentual usa a base escolhida',()=>{const t=traco();t.itens[6]={...t.itens[6],massaKgM3:undefined,dosagemPct:1,basePct:'cimento'};t.itens[7]={...t.itens[7],massaKgM3:undefined,dosagemPct:1,basePct:'aglomerante'};const r=calcularTraco(t)!;expect(r.itens.find(i=>i.id==='a1')?.massaResolvidaKgM3).toBe(3.5);expect(r.itens.find(i=>i.id==='a2')?.massaResolvidaKgM3).toBe(4)});
});
