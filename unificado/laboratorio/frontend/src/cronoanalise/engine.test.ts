import {describe, expect, it} from 'vitest';
import catalog from '../../../../../docs/porting/cronoanalise/especificacao/seeds/catalogo.json';
import layoutRows from '../../../../../docs/porting/cronoanalise/especificacao/seeds/layout_setores.json';
import params from '../../../../../docs/porting/cronoanalise/especificacao/seeds/parametros.json';
import golden from '../../../../../docs/porting/cronoanalise/especificacao/tests/golden.json';
import {diaProducao, formasSetor, lognormal, parseRegra, POL_LIST} from './engine';

function same(actual: unknown, expected: unknown, location = 'resultado'): void {
  if (expected === null && typeof actual === 'number' && Number.isNaN(actual)) return;
  if (typeof expected === 'number') {
    expect(typeof actual, location).toBe('number');
    expect(Math.abs((actual as number) - expected), location).toBeLessThanOrEqual(1e-9);
  } else if (Array.isArray(expected)) {
    expect(Array.isArray(actual), location).toBe(true);
    expect((actual as unknown[]).length, location).toBe(expected.length);
    expected.forEach((item, index) => same((actual as unknown[])[index], item, `${location}[${index}]`));
  } else if (expected && typeof expected === 'object') {
    expect(actual && typeof actual === 'object', location).toBeTruthy();
    for (const [key, value] of Object.entries(expected))
      same((actual as Record<string, unknown>)[key], value, `${location}.${key}`);
  } else {
    expect(actual, location).toBe(expected);
  }
}

const estimates = Object.fromEntries(catalog.atividades.map(item => [item.codigo, item.estimativa_min]));
const T = Object.assign((id: string, _sector: number, random: () => number) =>
  lognormal(random, estimates[id] ?? 1, 0.3), {med: (_id: string) => false});
const layout = Object.fromEntries(layoutRows.map(item => [item.setor, {
  dm: item.distancia_monovia_m, filas: item.filas, nf: item.formas_por_fila,
  d1: item.primeira_forma_m, dn: item.ultima_forma_m, tl: item.lancamento_min_por_forma,
  regra: item.regra_cacambas, cor: item.corredor_m ?? '', dest: item.setor_montagem_m ?? ''
}]));
const cfg = {...params.simulacao_base, vCarr: 30, vVazia: 45, vMono: 50};

describe('paridade 1:1 com o motor de referência', () => {
  it.each(golden.casos.map((expected, index) => ({numero: index + 1, expected})))('golden $numero/18', ({expected}) => {
    const result = diaProducao(cfg, layout, expected.politica, T, expected.seed);
    const mapped = {
      politica: expected.politica, seed: expected.seed,
      ...Object.fromEntries(['total', 'nConc', 'fimConc', 'fimMont', 'fimLivre', 'extra', 'acab',
        'car', 'pinosLate', 'inter', 'bloq', 'pass', 'idade', 'esperaPronta']
        .map(key => [key, (result as Record<string, unknown>)[key]])),
      recursos: result.res.map(item => ({nome: item.name, ocupacao: item.util, espera: item.wait}))
    };
    same(mapped, expected);
  });

  it('interpreta a regra escalonada do setor 3', () => {
    const rule = parseRegra('1-20: 1/2; 21-40: 1; 41-52: 1,5');
    expect([rule(1), rule(20), rule(21), rule(40), rule(41), rule(52)])
      .toEqual([0.5, 0.5, 1, 1, 1.5, 1.5]);
  });

  it('gera 292 formas e 129 viagens de caçamba no layout padrão', () => {
    const bySector = layoutRows.map(row => formasSetor(row.setor, layout[row.setor]));
    expect(bySector.reduce((sum, forms) => sum + forms.length, 0)).toBe(292);
    expect(bySector.reduce((sum, forms) =>
      sum + Math.ceil(forms.reduce((amount, form) => amount + form.need, 0) - 1e-9), 0)).toBe(129);
    expect(POL_LIST).toHaveLength(6);
  });
});
