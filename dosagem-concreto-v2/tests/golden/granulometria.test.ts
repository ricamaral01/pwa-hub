import { expect, it } from 'vitest';
import { calcularGranulometria } from '../../src/core/calc/granulometria';
it('amostra do mockup aprovado reproduz MF e Dmáx resumidos no Apêndice B',()=>{
  const r=calcularGranulometria([{aberturaMm:9.5,massaRetidaG:0},{aberturaMm:6.3,massaRetidaG:0},{aberturaMm:4.75,massaRetidaG:12},{aberturaMm:2.36,massaRetidaG:48},{aberturaMm:1.18,massaRetidaG:85},{aberturaMm:.6,massaRetidaG:120},{aberturaMm:.3,massaRetidaG:135},{aberturaMm:.15,massaRetidaG:75},{aberturaMm:0,massaRetidaG:25}],500);
  expect(r.moduloFinura).toBeCloseTo(2.714,3);expect(r.dmaxMm).toBe(4.75);expect(r.zona).toBe('ótima');expect(r.perdaG).toBe(0);
});
