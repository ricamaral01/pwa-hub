import { expect, it } from 'vitest';
import { converterObjetosLegados } from '../../src/data/legacyConverter';
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
