import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type SyntheticEvent } from 'react';
import { Icon } from './icons';
import type { NavItem, NavModule } from './navConfig';
import './sidebar.css';

export type SidebarProps = {
  modules: NavModule[];             // já filtrados pelas permissões do usuário
  activeModuleId: string;
  activePath: string;               // ex.: location.pathname
  footerItems: NavItem[];
  user: { name: string; role: string };
  version: string;                  // ex.: '1.0.10'
  logoConcrefer: string;            // src do logo Concrefer
  logoConcretrack: string;          // src do "C" ConcreTrack
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectModule: (moduleId: string) => void; // mostra as funções do módulo
  onNavigate: (href: string) => void;         // ex.: navigate(href) do react-router
  onLogout: () => void;
  updateAvailable?: boolean;
  onUpdate?: () => void;
};

const isActive = (item: NavItem, path: string) =>
  path === item.href || path.startsWith(item.href + '/');

export function Sidebar(p: SidebarProps) {
  const mod = p.modules.find((m) => m.id === p.activeModuleId) ?? p.modules[0];
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null);

  // Dica flutuante do modo recolhido (position: fixed, não é cortada pela rolagem).
  const showTip = (e: SyntheticEvent) => {
    if (!p.collapsed) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!el) return setTip(null);
    const r = el.getBoundingClientRect();
    setTip({ text: el.dataset.tip ?? '', top: r.top + r.height / 2, left: r.right + 12 });
  };
  const hideTip = () => setTip(null);
  useEffect(() => { if (!p.collapsed) setTip(null); }, [p.collapsed]);

  // Fecha o seletor de módulo ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!switcherOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!switcherRef.current?.contains(e.target as Node)) setSwitcherOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSwitcherOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [switcherOpen]);

  const go = (href: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // deixa abrir em nova aba
    e.preventDefault();
    p.onNavigate(href);
  };

  const link = (item: NavItem) => {
    const active = isActive(item, p.activePath);
    return (
      <a
        key={item.id}
        href={item.href}
        className={'sb-link' + (active ? ' is-active' : '')}
        aria-current={active ? 'page' : undefined}
        data-tip={item.label}
        onClick={go(item.href)}
      >
        <Icon name={item.icon} />
        <span className="sb-label">{item.label}</span>
        {item.badge && <span className={'sb-badge sb-badge--' + item.badge.tone}>{item.badge.text}</span>}
      </a>
    );
  };

  if (!mod) return null;

  return (
    <nav
      className={'sb' + (p.collapsed ? ' is-collapsed' : '')}
      aria-label="Menu principal"
      style={{ '--mod': mod.color } as CSSProperties}
      onMouseOver={showTip}
      onFocus={showTip}
      onMouseLeave={hideTip}
      onBlur={hideTip}
    >
      {/* Marca: Concrefer + "C" ConcreTrack sempre visíveis */}
      <div className="sb-brand">
        <a className="sb-logo" href="/unificado/" aria-label="Ir ao menu principal" data-tip="Menu principal" onClick={go('/unificado/')}>
          <img className="sb-logo-concrefer" src={p.logoConcrefer} alt="Concrefer" />
          <span className="sb-logo-sep" aria-hidden="true" />
          <img className="sb-logo-ct" src={p.logoConcretrack} alt="ConcreTrack" />
        </a>
        <button
          type="button"
          className="sb-iconbtn sb-collapse"
          aria-label={p.collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!p.collapsed}
          onClick={p.onToggleCollapsed}
        >
          <Icon name={p.collapsed ? 'chevronRight' : 'chevronLeft'} />
        </button>
      </div>

      {/* Seletor de módulo */}
      <div className="sb-switcher" ref={switcherRef}>
        <button
          type="button"
          className="sb-switcher-btn"
          aria-haspopup="menu"
          aria-expanded={switcherOpen}
          data-tip={'Módulo: ' + mod.label}
          onClick={() => { setTip(null); setSwitcherOpen((v) => !v); }}
        >
          <span className="sb-mod-tile"><Icon name={mod.icon} /></span>
          <span className="sb-switcher-text">
            <span className="sb-eyebrow">MÓDULO</span>
            <span className="sb-switcher-name">{mod.label}</span>
          </span>
          <span className="sb-switcher-chev"><Icon name="updown" /></span>
        </button>
        {switcherOpen && (
          <div className="sb-menu" role="menu">
            {p.modules.map((m) => (
              <button
                key={m.id}
                type="button"
                role="menuitemradio"
                aria-checked={m.id === mod.id}
                className="sb-menu-item"
                onClick={() => { setSwitcherOpen(false); p.onSelectModule(m.id); }}
              >
                <span className="sb-dot" style={{ background: m.color }} />
                {m.label}
                {m.id === mod.id && <span className="sb-menu-check"><Icon name="check" size={16} /></span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Telas do módulo, agrupadas por seção */}
      <div className="sb-scroll">
        {mod.sections.map((s) => (
          <div className="sb-section" key={s.title}>
            <div className="sb-section-title">{s.title}</div>
            {s.items.map(link)}
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="sb-footer">
        {p.updateAvailable && (
          <button type="button" className="sb-update" data-tip="Atualizar aplicativo" onClick={p.onUpdate}>
            <span className="sb-update-dot" aria-hidden="true" />
            <span className="sb-label">Nova versão — atualizar</span>
          </button>
        )}
        {p.footerItems.map(link)}
        <div className="sb-user">
          <span className="sb-avatar" aria-hidden="true">{p.user.name.trim().charAt(0).toUpperCase()}</span>
          <span className="sb-user-text">
            <span className="sb-user-name">{p.user.name}</span>
            <span className="sb-user-meta">{p.user.role}</span>
            <span className="sb-user-meta sb-mono">v{p.version}</span>
          </span>
          <button type="button" className="sb-iconbtn" aria-label="Sair" data-tip="Sair" onClick={p.onLogout}>
            <Icon name="logout" />
          </button>
        </div>
      </div>

      {p.collapsed && tip && !switcherOpen && (
        <div className="sb-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>{tip.text}</div>
      )}
    </nav>
  );
}

// Estado recolhido lembrado por navegador (só conveniência; falha silenciosa).
export function useSidebarCollapsed(key = 'ct.sidebar.collapsed') {
  const initial = () => {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) return v === '1';
    } catch { /* sem storage */ }
    return typeof window !== 'undefined' && window.innerWidth < 1200; // tablet começa recolhido
  };
  const [collapsed, setCollapsed] = useState<boolean>(initial);
  const toggle = () =>
    setCollapsed((v) => {
      try { localStorage.setItem(key, v ? '0' : '1'); } catch { /* ignora */ }
      return !v;
    });
  return [collapsed, toggle] as const;
}
