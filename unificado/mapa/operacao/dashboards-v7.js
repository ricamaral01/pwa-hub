(() => {
  'use strict';
  const dashboards = [
    ['PROD_ANALISE', 'Concretagem', 'viewProdAnalise'],
    ['MONTAGEM_INDICADORES', 'Montagem', 'viewMontagemIndicadores'],
    ['DASHBOARD_DEFEITOS', 'Defeitos', 'viewDashboardDefeitos'],
  ];
  function install() {
    for (const [currentMode, , id] of dashboards) {
      const view = document.getElementById(id);
      if (!view || view.querySelector('.dash-v7-switch')) continue;
      const navigation = document.createElement('nav');
      navigation.className = 'dash-v7-switch';
      navigation.setAttribute('aria-label', 'Dashboards da produção');
      for (const [mode, label] of dashboards) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.mode = mode;
        button.textContent = label;
        if (mode === currentMode) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => {
          if (typeof setMode === 'function' &&
              (typeof isModeAllowed !== 'function' || isModeAllowed(mode))) setMode(mode);
        });
        navigation.append(button);
      }
      const anchor = currentMode === 'DASHBOARD_DEFEITOS'
        ? view.querySelector('.df-v4-title-row') : view.querySelector('.mi-topbar');
      anchor?.after(navigation);
    }
    const updateAccess = () => document.querySelectorAll('.dash-v7-switch button').forEach(button => {
      button.hidden = typeof isModeAllowed === 'function' && !isModeAllowed(button.dataset.mode);
    });
    updateAccess();
    const timer = setInterval(updateAccess, 1000);
    setTimeout(() => clearInterval(timer), 30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
