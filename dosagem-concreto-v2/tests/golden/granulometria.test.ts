import { expect, it } from 'vitest';
import { calcularGranulometria } from '../../src/core/calc/granulometria';
it('caso sintético reproduz MF e Dmáx resumidos no Apêndice B',()=>{
  const r=calcularGranulometria([{aberturaMm:75,massaRetidaG:0},{aberturaMm:37.5,massaRetidaG:0},{aberturaMm:19,massaRetidaG:0},{aberturaMm:9.5,massaRetidaG:0},{aberturaMm:4.75,massaRetidaG:30},{aberturaMm:2.36,massaRetidaG:80},{aberturaMm:1.18,massaRetidaG:150},{aberturaMm:.6,massaRetidaG:280},{aberturaMm:.3,massaRetidaG:234},{aberturaMm:.15,massaRetidaG:226}],1000);
  expect(r.moduloFinura).toBeCloseTo(2.714,3);expect(r.dmaxMm).toBe(4.75);expect(r.zona).toBe('ótima');expect(r.perdaG).toBe(0);
});
