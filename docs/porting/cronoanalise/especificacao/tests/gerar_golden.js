// Gera tests/golden.json a partir do motor de referência (reference/engine.js).
// Uso: node tests/gerar_golden.js
// O port TypeScript deve produzir EXATAMENTE os mesmos números (tolerância 1e-9) com as mesmas entradas e sementes.
const path = require('path');
const fs = require('fs');
const E = require(path.join(__dirname, '..', 'reference', 'engine.js'));
const cat = require(path.join(__dirname, '..', 'seeds', 'catalogo.json'));
const layArr = require(path.join(__dirname, '..', 'seeds', 'layout_setores.json'));
const par = require(path.join(__dirname, '..', 'seeds', 'parametros.json'));

// tempos: estimativas do catálogo, CV 0.3 (mesma regra do app quando não há medições)
const est = Object.fromEntries(cat.atividades.map(a => [a.codigo, a.estimativa_min]));
const T = (id, setor, rnd) => E.lognormal(rnd, est[id] ?? 1, 0.3);
T.med = () => false;

const lay = {};
for (const L of layArr) lay[L.setor] = { dm: L.distancia_monovia_m, filas: L.filas, nf: L.formas_por_fila, d1: L.primeira_forma_m, dn: L.ultima_forma_m, tl: L.lancamento_min_por_forma, regra: L.regra_cacambas, cor: L.corredor_m ?? '', dest: L.setor_montagem_m ?? '' };

const cfg = { ...par.simulacao_base, vCarr: 30, vVazia: 45, vMono: 50 };
const out = { gerado_em: new Date().toISOString(), entradas: { seeds: [101, 102, 103], politicas: E.POL_LIST }, casos: [] };
const KEYS = ['total', 'nConc', 'fimConc', 'fimMont', 'fimLivre', 'extra', 'acab', 'car', 'pinosLate', 'inter', 'bloq', 'pass', 'idade', 'esperaPronta'];
for (const p of E.POL_LIST) for (const seed of out.entradas.seeds) {
  const r = E.diaProducao(cfg, lay, p, T, seed);
  const o = { politica: p, seed };
  for (const k of KEYS) o[k] = r[k];
  o.recursos = r.res.map(x => ({ nome: x.name, ocupacao: x.util, espera: x.wait }));
  out.casos.push(o);
}
// exemplos estatísticos da página de metodologia (devem bater no backend Python)
out.estatistica = {
  amostra_P08: [1.20, 1.45, 1.10, 1.62, 1.30, 1.28, 1.55, 1.18, 1.40, 1.35],
  esperado: { media: 1.343, desvio: 0.1653985, cv: 0.1231560, n_necessario_95_5: 24, faixa_2s: [1.0122030, 1.6737970] },
  tempo_padrao: { ritmo: 105, tolerancias_pct: 13, FT: 1.1494253, TN: 1.41015, TP: 1.6208621 },
  dimensionamento: { HM: 42.9, demanda: 292, T_disp: 528, eta: 0.9, takt: 1.8082192, N_teorico: 23.725, N: 26.361111, N_arred: 27, capacidade_26: 288.0 },
  velocidade: { d: [52, 48, 60], t: [1.8, 1.5, 2.1], v: 29.6296296 }
};
fs.writeFileSync(path.join(__dirname, 'golden.json'), JSON.stringify(out, null, 1));
console.log('golden.json:', out.casos.length, 'casos');
