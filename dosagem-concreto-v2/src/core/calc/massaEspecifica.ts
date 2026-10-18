export function massaEspecificaMiudo(massaSecaG: number, leituraInicialMl: number, leituraFinalMl: number): number {
  const deslocado = leituraFinalMl - leituraInicialMl;
  if (massaSecaG <= 0 || deslocado <= 0) throw new Error('Massa e volume deslocado devem ser positivos.');
  return massaSecaG / deslocado;
}
export function massaEspecificaGraudo(A: number, B: number, C: number) {
  if (A <= 0 || B <= C || A <= C || B < A) throw new Error('Pesagens hidrostáticas inválidas.');
  return { seca: A / (B - C), sss: B / (B - C), real: A / (A - C), absorcaoPct: (B - A) / A * 100 };
}
