import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar, useSidebarCollapsed } from './components/sidebar/Sidebar';
import { FOOTER_ITEMS, NAV_MODULES, type NavModule } from './components/sidebar/navConfig';

type Snapshot = {
  activeModuleId: string;
  activePath: string;
  allowedModuleIds: string[];
  allowedItemIds: string[];
  footerItemIds: string[];
  user: { name: string; role: string };
  version: string;
  updateAvailable: boolean;
};
type ShellBridge = {
  snapshot: () => Snapshot;
  navigate: (href: string) => void;
  selectModule: (moduleId: string) => void;
  update: () => void;
  logout: () => void;
};
declare global {
  interface Window { UnificadoSidebarModelA?: ShellBridge }
}

function filterModules(snapshot: Snapshot): NavModule[] {
  const modules = new Set(snapshot.allowedModuleIds);
  const items = new Set(snapshot.allowedItemIds);
  return NAV_MODULES.filter(module => modules.has(module.id)).map(module => ({
    ...module,
    sections: module.sections.map(section => ({
      ...section, items: section.items.filter(item => items.has(item.id)),
    })).filter(section => section.items.length > 0),
  })).filter(module => module.sections.length > 0);
}

function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() => window.UnificadoSidebarModelA?.snapshot() ?? null);
  const [collapsed, onToggleCollapsed] = useSidebarCollapsed();

  useEffect(() => {
    const refresh = () => setSnapshot(window.UnificadoSidebarModelA?.snapshot() ?? null);
    window.addEventListener('unificado-sidebar-model-a-update', refresh);
    window.addEventListener('popstate', refresh);
    refresh();
    return () => {
      window.removeEventListener('unificado-sidebar-model-a-update', refresh);
      window.removeEventListener('popstate', refresh);
    };
  }, []);

  useEffect(() => {
    const reveal = () => { if (collapsed) onToggleCollapsed(); };
    window.addEventListener('unificado-sidebar-module-selected', reveal);
    return () => window.removeEventListener('unificado-sidebar-module-selected', reveal);
  }, [collapsed, onToggleCollapsed]);

  useEffect(() => {
    document.querySelector('#sidebar-model-a .sb-scroll')?.scrollTo(0, 0);
  }, [snapshot?.activeModuleId]);

  if (!snapshot || !window.UnificadoSidebarModelA) return null;
  const modules = filterModules(snapshot);
  if (modules.length === 0) return null;
  const activeModuleId = modules.some(module => module.id === snapshot.activeModuleId)
    ? snapshot.activeModuleId : modules[0].id;
  const footerAllowed = new Set(snapshot.footerItemIds);
  const footerItems = FOOTER_ITEMS.filter(item => footerAllowed.has(item.id)).map(item =>
    item.id === 'usuarios' && snapshot.allowedItemIds.includes('pcpUsuarios') &&
      !snapshot.allowedItemIds.includes('prodUsuarios')
      ? { ...item, href: '/unificado/?view=' + encodeURIComponent('pcp/usuarios/') }
      : item);
  const navigate = (href: string) => window.UnificadoSidebarModelA?.navigate(href);

  return <Sidebar
    modules={modules}
    activeModuleId={activeModuleId}
    activePath={snapshot.activePath}
    footerItems={footerItems}
    user={snapshot.user}
    version={snapshot.version}
    logoConcrefer="/unificado/assets/img/logo-concrefer.png"
    logoConcretrack="/unificado/assets/img/logo-concretrack.png"
    collapsed={collapsed}
    onToggleCollapsed={onToggleCollapsed}
    onSelectModule={moduleId => window.UnificadoSidebarModelA?.selectModule(moduleId)}
    onNavigate={navigate}
    onLogout={() => window.UnificadoSidebarModelA?.logout()}
    updateAvailable={snapshot.updateAvailable}
    onUpdate={() => window.UnificadoSidebarModelA?.update()}
  />;
}

const mount = document.getElementById('sidebar-model-a');
if (mount) createRoot(mount).render(<App />);
