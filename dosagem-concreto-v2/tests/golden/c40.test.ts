import { describe, expect, it } from 'vitest';
import type { Traco } from '../../src/core/model';
import { calcularTraco } from '../../src/core/calc/metodoManual';
import { corrigirUmidade } from '../../src/core/calc/umidade';
import { obterLimite } from '../../src/core/config/nbr12655';

// Entradas e saídas legíveis nos mockups aprovados 03 e 05. O Apêndice A anexado
// contém apenas o objetivo; por isso esta fixture é identificada como mockup.
const dados: Traco = {
  id: 'c40-mockup', codigo: 'TR-0042', nome: 'C40 Pré-moldado CA III', unidade: 'pederneiras',
  versao: 3, revisao: 1, status: 'em_teste', metodo: 'manual',
  objetivo: { fckMPa: 40, sdMPa: 4, classe: 'III', estrutura: 'armado', abatimentoMm: 100, toleranciaMm: 20 },
  arIncorporadoPct: 1.5, normalizarPara1m3: false, experimentais: [],
  auditoria: { criadoPor: 'fixture', criadoEm: '2026-10-17T00:00:00Z', alteradoPor: 'fixture', alteradoEm: '2026-10-17T00:00:00Z' },
  itens: [
    { id: 'cim', nome: 'Cimento CP V-ARI', categoria: 'cimento', massaKgM3: 340, massaEspecificaKgDm3: 3.10, custoRsKg: .78 },
    { id: 'adic', nome: 'Metacaulim', categoria: 'adicao', massaKgM3: 20, massaEspecificaKgDm3: 2.55, custoRsKg: 1.4 },
    { id: 'an', nome: 'Areia natural', categoria: 'areia', massaKgM3: 520, massaEspecificaKgDm3: 2.63, umidadeLivrePct: 4.2, custoRsKg: .085 },
    { id: 'ai', nome: 'Areia industrial', categoria: 'areia', massaKgM3: 300, massaEspecificaKgDm3: 2.70, umidadeLivrePct: 2, custoRsKg: .07 },
    { id: 'b0', nome: 'Brita 0', categoria: 'brita', massaKgM3: 250, massaEspecificaKgDm3: 2.75, custoRsKg: .075 },
    { id: 'b1', nome: 'Brita 1', categoria: 'brita', massaKgM3: 782, massaEspecificaKgDm3: 2.75, custoRsKg: .07 },
    { id: 'agua', nome: 'Água', categoria: 'agua', massaKgM3: 180, massaEspecificaKgDm3: 1, custoRsKg: .01 },
    { id: 'adit1', nome: 'Superplastificante PCE', categoria: 'aditivo', dosagemPct: .8, basePct: 'cimento', massaEspecificaKgDm3: 1.07, custoRsKg: 9.5 },
    { id: 'adit2', nome: 'Retardador', categoria: 'aditivo', dosagemPct: .3, basePct: 'cimento', massaEspecificaKgDm3: 1.15, custoRsKg: 7.34 / 1.02 }
  ]
};
const proximo = (atual: number, esperado: number, tolerancia: number) => expect(Math.abs(atual - esperado)).toBeLessThanOrEqual(tolerancia);

describe('C40 dos mockups aprovados — Apêndice A incompleto no anexo', () => {
  const r = calcularTraco(dados)!;
  it('volumes individuais, ar e composição', () => {
    for (const [id, volume] of [['cim',109.7],['adic',7.8],['an',197.7],['ai',111.1],['b0',90.9],['b1',284.4],['agua',180],['adit1',2.5],['adit2',.9]] as const) {
      proximo(r.itens.find(i => i.id === id)!.volumeL, volume, .05);
    }
    proximo(r.volumeArL, 15, .05);
    proximo(r.massaTotalKgM3, 2395.7, .05);
  });
  it('volume total anunciado de 1.000,0 L', () => {
    // Divergência a decidir: fórmula com as densidades publicadas dá 1000,052 L.
    proximo(r.volumeTotalL, 1000, .05);
  });
  it('indicadores, custo e resistência', () => {
    proximo(r.relacaoAguaCimento, .53, .005);
    proximo(r.relacaoAguaAglomerante, .50, .005);
    proximo(r.teorArgamassaSecoPct, 53.3, .05);
    proximo(r.tracoUnitario.areia, 2.28, .005);
    proximo(r.tracoUnitario.brita, 2.87, .005);
    proximo(r.tracoUnitario.agua, .50, .005);
    expect(Math.round(r.massaEspecificaTeoricaKgM3)).toBe(2396);
    proximo(r.custoRsM3, 466.87, .05);
    proximo(r.fcjMPa, 46.6, .05);
  });
  it('limites de referência CA III e correção de umidade', () => {
    const limite = obterLimite('III','armado')!;
    expect(limite.relacaoAguaCimentoMax).toBe(.55);
    expect(limite.consumoCimentoMinKgM3).toBe(320);
    expect(r.relacaoAguaCimento).toBeLessThanOrEqual(limite.relacaoAguaCimentoMax!);
    expect(r.consumoCimentoKgM3).toBeGreaterThanOrEqual(limite.consumoCimentoMinKgM3!);
    const obra = corrigirUmidade(r.itens);
    proximo(obra.itens.find(i => i.id === 'an')!.massaObraKgM3, 541.84, .05);
    proximo(obra.itens.find(i => i.id === 'ai')!.massaObraKgM3, 306, .05);
    proximo(obra.aguaObraKgM3, 152.16, .05);
  });
});
