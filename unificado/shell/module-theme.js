/* Fonte única da paleta dos módulos para a home, páginas e sidebar. */
(() => {
  const theme = {
    logistica: {sigla:'LG',color:'#38BDF8',ink:'#0F1B2D',soft:'#E0F2FE',accentInk:'#0369A1'},
    planejamento: {sigla:'PL',color:'#5B8DEF',ink:'#0F1B2D',soft:'#E6EEFD',accentInk:'#2C5BC4'},
    producao: {sigla:'PR',color:'#F08C3E',ink:'#0F1B2D',soft:'#FDEBDD',accentInk:'#A2500F'},
    qualidade: {sigla:'QU',color:'#2BB08A',ink:'#0F1B2D',soft:'#DDF4EC',accentInk:'#167257'},
    laboratorio: {sigla:'LB',color:'#F2B705',ink:'#0F1B2D',soft:'#FFF4D6',accentInk:'#8A5A00'},
    usinas: {sigla:'US',color:'#17908F',ink:'#FFFFFF',soft:'#DAF0F0',accentInk:'#0E6565'},
    ged: {sigla:'GD',color:'#9B7BEA',ink:'#FFFFFF',soft:'#EEE8FC',accentInk:'#6644C4'},
    suprimentos: {sigla:'SU',color:'#4A7FE0',ink:'#FFFFFF',soft:'#E3ECFB',accentInk:'#2A5BB8'},
    pederh: {sigla:'RH',color:'#E8803A',ink:'#0F1B2D',soft:'#FCE9DA',accentInk:'#A04F12'},
    faleaqui: {sigla:'FA',color:'#4E86B0',ink:'#FFFFFF',soft:'#E1ECF5',accentInk:'#2C5F86'},
  };
  const vars = t => ({'--accent':t.color,'--accent-soft':t.soft,'--accent-ink':t.accentInk,'--hero-ink':t.ink});
  window.UnificadoModuleTheme = Object.freeze({theme:Object.freeze(theme),vars});
})();
