import { expect, it, vi } from 'vitest';
import { converterLocalStorage, converterObjetosLegados } from '../../src/data/legacyConverter';
import { calcularTraco } from '../../src/core/calc/metodoManual';
import type { Traco } from '../../src/core/model';

it('mantém segunda areia e segundo aditivo com densidades próprias', () => {
  const origem = { id: 'antigo-7', nome: 'Duas areias', fck: 40, cim: 350, an: 500, an2: 100, adit: 7, adit2: 4, agua: 175,
    rhoCim: 3.12, rhoAn: 2.6, rhoAn2: 2.5, rhoAdit: 1.1, rhoAdit2: 1.2, ar: 1.5 };
  const previa = converterObjetosLegados([origem], 'json:teste', 'campinas');
  expect(previa.avisos).toEqual([]);
  expect(previa.convertidos).toHaveLength(1);
  const t = previa.convertidos[0].documento as unknown as Traco;
  expect(t.itens.filter(i => i.categoria === 'areia').map(i => i.massaKgM3)).toEqual([400,100]);
  expect(t.itens.filter(i => i.categoria === 'aditivo').map(i => i.massaKgM3)).toEqual([3,4]);
  const r = calcularTraco(t)!;
  expect(r.itens.find(i => i.nome === 'Areia natural 2')?.volumeL).toBeCloseTo(40, 8);
  expect(r.itens.find(i => i.nome === 'Aditivo 2')?.volumeL).toBeCloseTo(4/1.2, 8);
});

it('avisa e não inventa densidade faltante', () => {
  const previa = converterObjetosLegados([{ id:'antigo-8', fck:40, cim:350, rhoCim:3.1, an:100 }], 'json:teste', 'campinas');
  expect(previa.convertidos).toHaveLength(0);
  expect(previa.avisos[0]).toContain('massa específica ausente');
});

it('converte fornecedores e ensaios granulométricos do armazenamento legado', () => {
  const valores: Record<string, string> = {
    cadastroFornecedoresV1: JSON.stringify([{ id: 'f1', fornecedor: 'Pedreira A', telefone: '123' }]),
    ensaiosGranMiudo: JSON.stringify([{ tipo: 'gran_miudo', material: 'Areia A', timestamp: '2026-10-17T10:00:00Z', peneiras: { '4_75': { pm1: '12' } } }])
  };
  vi.stubGlobal('localStorage', { getItem: (key: string) => valores[key] || null });
  try {
    const previa = converterLocalStorage('campinas');
    expect(previa.lidos).toBe(2);
    expect(previa.avisos).toEqual([]);
    expect(previa.convertidos.map(x => x.tipo)).toEqual(['fornecedores', 'ensaios']);
    expect(previa.convertidos[1].documento.tipo).toBe('granulometria_miudo');
    expect((previa.convertidos[1].documento.dados as Record<string, unknown>).peneiras).toBeDefined();
  } finally { vi.unstubAllGlobals(); }
});
