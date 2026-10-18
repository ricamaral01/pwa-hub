import { moduloFinura, serieNormalMm } from '../config/nbr7211';
export interface Peneira { aberturaMm: number; massaRetidaG: number }
export function calcularGranulometria(peneiras: Peneira[], massaInicialG: number) {
  if (massaInicialG <= 0 || !Number.isFinite(massaInicialG)) throw new Error('Massa inicial deve ser positiva.');
  if (!peneiras.length || peneiras.some(p => p.aberturaMm < 0 || p.massaRetidaG < 0 || !Number.isFinite(p.massaRetidaG))) throw new Error('Peneiras inválidas.');
  const ordenadas = [...peneiras].sort((a, b) => b.aberturaMm - a.aberturaMm);
  let acum = 0;
  const linhas = ordenadas.map(p => { const retidaPct = p.massaRetidaG / massaInicialG * 100; acum += retidaPct; return { ...p, retidaPct, acumuladaPct: acum, passantePct: 100 - acum }; });
  const mf = linhas.filter(p => serieNormalMm.includes(p.aberturaMm)).reduce((s, p) => s + p.acumuladaPct, 0) / 100;
  const primeira = linhas.findIndex(p => p.acumuladaPct > 5);
  const dmaxMm = primeira <= 0 ? (linhas[0]?.aberturaMm ?? 0) : linhas[primeira - 1].aberturaMm;
  const perdaG = massaInicialG - linhas.reduce((s, p) => s + p.massaRetidaG, 0);
  const zona = mf >= moduloFinura.otima[0] && mf <= moduloFinura.otima[1] ? 'ótima' : mf >= moduloFinura.utilizavelInferior[0] && mf <= moduloFinura.utilizavelSuperior[1] ? 'utilizável' : 'fora de zona';
  return { linhas, moduloFinura: mf, dmaxMm, perdaG, perdaPct: perdaG / massaInicialG * 100, perdaAcimaLimite: perdaG / massaInicialG > 0.003, zona };
}
