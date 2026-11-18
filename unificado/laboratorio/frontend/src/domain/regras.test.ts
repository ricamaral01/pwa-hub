import {describe, expect, it} from 'vitest';
import {avaliarCobrimento, type Cobrimento} from './regras';

describe('cobrimento de registros antigos', () => {
  it('usa a classe II quando a CAA ainda não foi salva', () => {
    const leituras: Cobrimento = {
      topo: ['26', '25', '25'],
      meio: ['27', '25', '25'],
      base: ['25', '27', '26'],
    };
    const result = avaliarCobrimento(leituras, undefined);
    expect(result?.minimo_mm).toBe(15);
    expect(result?.status).toBe('DENTRO');
    expect(result?.media_geral_mm).toBeCloseTo(25.67, 2);
    expect(avaliarCobrimento(leituras, 'III')?.status).toBe('DENTRO');
  });
});
