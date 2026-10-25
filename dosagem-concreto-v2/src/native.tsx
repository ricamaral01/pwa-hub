import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './app/App';
import './ui/tokens.css';

const stylesheet = '/unificado/laboratorio/dosagem/native/dosagem-native.css?v=1.0.31';
let mounted: { container: HTMLElement; root: Root } | null = null;
let printStyle: HTMLStyleElement | null = null;

export async function mountDosagem(container: HTMLElement): Promise<void> {
  if (mounted?.container === container) return;
  unmountDosagem();
  window.__DOSAGEM_NATIVE__ = true;
  const response = await fetch(stylesheet, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Falha ao carregar estilos da Dosagem: HTTP ${response.status}`);
  const css = (await response.text()).replaceAll(':root', ':host');
  const shadow = container.shadowRoot || container.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css + '\n:host{display:block;min-height:100%;font-family:var(--ct-font);color:var(--ct-ink);background:var(--ct-bg)}.ct-native-root{min-height:100%;padding:24px;box-sizing:border-box}.ct-native-main{max-width:1600px;margin:auto}@media print{.ct-native-root{padding:0!important}.ct-native-main{max-width:none!important}}';
  const app = document.createElement('div');
  app.className = 'ct-native-root';
  shadow.replaceChildren(style, app);
  printStyle = document.createElement('style');
  printStyle.dataset.dosagemNativePrint = 'true';
  printStyle.textContent = '@media print{#sidebar-model-a,#sidebar,.main-panel>.topbar,.main-panel>.content,.mobile-notice{display:none!important}.desktop-only,.main-panel{display:block!important}.main-panel{min-height:0!important;overflow:visible!important;margin:0!important;border:0!important;border-radius:0!important}#module-host{height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important}}';
  document.head.append(printStyle);
  const root = createRoot(app);
  root.render(<React.StrictMode><App /></React.StrictMode>);
  mounted = { container, root };
}

export function unmountDosagem(): void {
  if (!mounted) return;
  mounted.root.unmount();
  printStyle?.remove();
  printStyle = null;
  mounted.container.shadowRoot?.replaceChildren();
  mounted = null;
}
