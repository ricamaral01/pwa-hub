/* Fonte única da paleta dos módulos para a home, páginas e sidebar. */
(() => {
  const theme = {
    logistica: {sigla:'LG',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    planejamento: {sigla:'PL',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    producao: {sigla:'PR',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    qualidade: {sigla:'QU',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    laboratorio: {sigla:'LB',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    usinas: {sigla:'US',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    ged: {sigla:'GD',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    suprimentos: {sigla:'SU',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    pederh: {sigla:'RH',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
    faleaqui: {sigla:'FA',color:'var(--c-orange)',ink:'var(--c-ink)',soft:'var(--c-line-2)',accentInk:'var(--c-blue)'},
  };
  const vars = t => ({'--accent':t.color,'--accent-soft':t.soft,'--accent-ink':t.accentInk,'--hero-ink':t.ink});
  window.UnificadoModuleTheme = Object.freeze({theme:Object.freeze(theme),vars});
})();
