import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/icons';
import type { SaveStatus } from '../data/sync';
import { SaveStatusView } from '../ui/components';
import { getUsuario } from '../data/authAdapter';
import './layout.css';

async function sair() {
  await fetch('/api/v1/auth/sair', { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'dosagem' } });
  window.location.assign('/auth/login/');
}

export function usePilotMode() {
  const [pilot, setPilot] = useState<boolean | null>(null);
  useEffect(() => { void fetch(window.__DOSAGEM_NATIVE__ ? '/unificado/laboratorio/dosagem/api/v1/saude' : '/api/v1/saude').then(response => response.json()).then(body => setPilot(body.piloto === true)).catch(() => {}); }, []);
  return pilot;
}

export function useUsuario() {
  const [user, setUser] = useState<{ nome: string; email: string } | null>(null);
  useEffect(() => { void getUsuario().then(u => setUser(u)); }, []);
  return user;
}

/** Aviso de piloto: continua com papel de status e a palavra PILOTO visível em todos os tamanhos. */
export function PilotNotice({ compact = false }: { compact?: boolean }) {
  const pilot = usePilotMode();
  if (pilot === false) return null;
  return compact
    ? <div className="ct-pilot-banner ct-pilot-strip" role="status"><Icon name="alerta" size={14} strokeWidth={2.4}/>PILOTO — o sistema oficial continua sendo o legado</div>
    : <span className="ct-pilot-banner ct-pill ct-pill--pilot" role="status" title="O sistema oficial continua sendo o legado. Não use estas cartas na produção."><Icon name="alerta" size={14} strokeWidth={2.4}/><span aria-hidden="true">PILOTO · legado é oficial</span><span className="ct-visually-hidden">PILOTO — o sistema oficial continua sendo o legado</span></span>;
}
/** Mantido por compatibilidade; a casca agora usa PilotNotice. */
export function PilotBanner() { return <PilotNotice compact/>; }

export type LayoutMode = 'desktop' | 'tablet' | 'mobile';
export type LayoutPreference = LayoutMode | 'automatico';
type NavItem = { path: string; label: string; short?: string; icon: string; count?: 'tracos' };
const groups: { title: string; items: NavItem[] }[] = [
  { title: 'Engenharia', items: [
    { path: '/', label: 'Início', icon: 'inicio' },
    { path: '/dosagem/empacotamento', label: 'Dosagem por empacotamento', short: 'Por empacotamento', icon: 'empacotamento' },
    { path: '/dosagem/volume', label: 'Dosagem por volume', short: 'Por volume', icon: 'volume' },
    { path: '/tracos', label: 'Traços', icon: 'tracos', count: 'tracos' },
    { path: '/custos', label: 'Custos', icon: 'custos' },
    { path: '/ferramentas', label: 'Ferramentas', icon: 'ferramentas' },
    { path: '/referencia', label: 'Referência', icon: 'referencia' }
  ] },
  { title: 'Laboratório', items: [
    { path: '/ensaios', label: 'Ensaios', icon: 'ensaios' },
    { path: '/materiais', label: 'Materiais', icon: 'materiais' },
    { path: '/fornecedores', label: 'Fornecedores', icon: 'fornecedores' }
  ] },
  { title: 'Produção', items: [
    { path: '/producao-r1', label: 'Produção', icon: 'producao' },
    { path: '/importacao-r1', label: 'Importação', icon: 'importacao' }
  ] }
];
const configItem: NavItem = { path: '/config', label: 'Configurações', icon: 'config' };
const allNav = [...groups.flatMap(g => g.items), configItem];
const release2Nav = ['Gestão tecnológica', 'Otimização granulométrica', 'Recomendação por regressão', 'Importação do legado e CSV'];
export function groupOf(path: string) {
  if (path.startsWith('/traco/') || path === '/comparacao-metodos') return 'Engenharia';
  return groups.find(g => g.items.some(i => i.path === path))?.title ?? 'Configurações';
}
const isActive = (item: NavItem, path: string) => path === item.path || (item.path === '/tracos' && path.startsWith('/traco/'));

function readPref(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function writePref(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ } }

export function useLayoutMode(): [LayoutMode, LayoutPreference, (v: LayoutPreference) => void] {
  const [width,setWidth] = useState(window.innerWidth);
  const [preference,setPreference] = useState<LayoutPreference>(() => (readPref('dosagem-v2-layout') as LayoutPreference) || 'automatico');
  useEffect(() => { const handler = () => setWidth(window.innerWidth); window.addEventListener('resize',handler); return () => window.removeEventListener('resize',handler); },[]);
  const set = (v: LayoutPreference) => { setPreference(v); writePref('dosagem-v2-layout',v); };
  return [preference === 'automatico' ? width < 600 ? 'mobile' : width < 1280 ? 'tablet' : 'desktop' : preference, preference, set];
}
const initials = (name?: string) => (name || 'ConcreTrack').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');

function Logo({ collapsed }: { collapsed?: boolean }) { return <div className="ct-logo"><span className="ct-logo-mark">C</span>{!collapsed && <div><strong>CONCRETRACK</strong><small>DOSAGEM</small></div>}</div>; }

function Sidebar({ collapsed=false, onNavigate, onToggle, counts }: { collapsed?: boolean; onNavigate?: () => void; onToggle?: () => void; counts?: { tracos?: number } }) {
  const location = useLocation(); const user = useUsuario();
  const link = (item: NavItem) => <Link onClick={onNavigate} key={item.path} to={item.path} title={collapsed ? item.label : undefined} aria-label={collapsed ? item.label : undefined} className={`ct-nav-link${isActive(item, location.pathname) ? ' active' : ''}`} aria-current={isActive(item, location.pathname) ? 'page' : undefined}>
    <Icon name={item.icon}/>{!collapsed && <span>{item.short ?? item.label}</span>}{!collapsed && item.count && counts?.tracos != null && <span className="ct-nav-count">{counts.tracos}</span>}
  </Link>;
  return <nav className={`ct-sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="Navegação principal">
    <div className="ct-sidebar-top"><Logo collapsed={collapsed}/>{onToggle && <button type="button" className="ct-icon-button ct-sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} aria-expanded={!collapsed}><Icon name="recolher" size={18}/></button>}</div>
    <div className="ct-sidebar-list">
      {groups.map(group => <div className="ct-nav-group" key={group.title}>{!collapsed ? <div className="ct-nav-group-title">{group.title}</div> : <div className="ct-nav-group-rule" aria-hidden="true"/>}{group.items.map(link)}</div>)}
      {!collapsed && <details className="ct-nav-coming"><summary><span>Gestão · {release2Nav.length} módulos</span><span className="ct-nav-soon">Release 2</span></summary><ul>{release2Nav.map(label => <li key={label} aria-disabled="true">{label}</li>)}</ul></details>}
    </div>
    <div className="ct-sidebar-footer">
      {link(configItem)}
      {!collapsed && <div className="ct-sidebar-user"><span className="ct-avatar" aria-hidden="true">{initials(user?.nome)}</span><div><strong>{user?.nome || 'Usuário'}</strong><small>ConcreTrack · v2.0.0</small></div></div>}
    </div>
  </nav>;
}

function Topbar({ title, saveStatus, saveMessage, onSearch, compact=false }: { title: string; saveStatus: SaveStatus; saveMessage?: string; onSearch: () => void; compact?: boolean }) {
  const location = useLocation(); const user = useUsuario();
  return <header className={`ct-topbar${compact ? ' is-compact' : ''}`}>
    <div className="ct-top-title"><small>{groupOf(location.pathname).toUpperCase()}</small><strong>{title}</strong></div>
    <div className="ct-top-actions">
      <button type="button" className={`ct-top-search${compact ? ' is-compact' : ''}`} onClick={onSearch} aria-label={compact ? 'Buscar telas' : undefined}><Icon name="busca" size={18}/>{!compact && <><span>Buscar telas</span><kbd>Ctrl K</kbd></>}</button>
      <SaveStatusView status={saveStatus} message={saveMessage}/>
      <PilotNotice/>
      <button type="button" className="ct-button ct-button--ghost ct-button--sm" onClick={() => void sair()} aria-label={compact ? 'Sair' : undefined} title="Sair"><Icon name="sair" size={16}/>{!compact && 'Sair'}</button>
      {!compact && <span className="ct-avatar" title={user?.email} aria-hidden="true">{initials(user?.nome)}</span>}
    </div>
  </header>;
}

function MobileNav() {
  const location = useLocation(); const [more,setMore] = useState(false); const [create,setCreate] = useState(false);
  const close = () => { setMore(false); setCreate(false); };
  return <>
    <nav className="ct-mobile-nav" aria-label="Navegação móvel">
      <Link className={location.pathname==='/'?'active':''} to="/"><Icon name="inicio" size={22}/><span>Início</span></Link>
      <Link className={location.pathname==='/tracos'||location.pathname.startsWith('/traco/')?'active':''} to="/tracos"><Icon name="tracos" size={22}/><span>Traços</span></Link>
      <button className="ct-mobile-add" onClick={()=>setCreate(true)} aria-label="Criar novo"><Icon name="mais" size={26} strokeWidth={2.6}/></button>
      <Link className={location.pathname==='/ensaios'?'active':''} to="/ensaios"><Icon name="ensaios" size={22}/><span>Ensaios</span></Link>
      <button onClick={()=>setMore(true)} aria-label="Mais opções"><Icon name="menu" size={22}/><span>Mais</span></button>
    </nav>
    {(more||create) && <div className="ct-sheet-backdrop" onClick={close}><div className="ct-bottom-sheet" role="dialog" aria-modal="true" aria-label={create ? 'Criar' : 'Mais opções'} onClick={e=>e.stopPropagation()}>
      <div className="ct-row ct-space"><h2>{create ? 'Criar' : 'Mais opções'}</h2><button className="ct-icon-button" onClick={close} aria-label="Fechar">×</button></div>
      {create ? <>
        <Link to="/dosagem/empacotamento" onClick={close}><Icon name="empacotamento"/>Dosagem por empacotamento</Link>
        <Link to="/dosagem/volume" onClick={close}><Icon name="volume"/>Dosagem por volume</Link>
        <Link to="/ensaios" onClick={close}><Icon name="ensaios"/>Registrar ensaio</Link>
      </> : <>
        {groups.map(group => <div key={group.title} className="ct-sheet-group"><small>{group.title}</small>{group.items.filter(i => i.path !== '/').map(item => <Link key={item.path} to={item.path} onClick={close}><Icon name={item.icon}/>{item.label}</Link>)}</div>)}
        <Link to="/config" onClick={close}><Icon name="config"/>Configurações</Link>
        <button type="button" className="ct-sheet-exit" onClick={() => void sair()}><Icon name="sair"/>Sair</button>
      </>}
    </div></div>}
  </>;
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query,setQuery] = useState(''); const navigate = useNavigate();
  const results = allNav.filter(x => x.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="ct-modal-backdrop" role="presentation" onClick={onClose}><div className="ct-command" role="dialog" aria-modal="true" aria-label="Busca rápida" onClick={e=>e.stopPropagation()}>
    <input autoFocus aria-label="Buscar telas" placeholder="Ir para uma tela…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && results[0]) { navigate(results[0].path); onClose(); } }}/>
    {results.map(item => <button key={item.path} onClick={()=>{navigate(item.path);onClose()}}><Icon name={item.icon}/>{item.label}<small>{groupOf(item.path)}</small></button>)}
  </div></div>;
}

export function AppLayout({ children, mode, title, saveStatus, saveMessage, counts }: { children: ReactNode; mode: LayoutMode; title: string; saveStatus: SaveStatus; saveMessage?: string; counts?: { tracos?: number } }) {
  const [palette,setPalette] = useState(false); const [drawer,setDrawer] = useState(false);
  const [collapsed,setCollapsed] = useState(() => readPref('dosagem-v2-menu') === 'recolhido');
  const toggle = () => setCollapsed(c => { writePref('dosagem-v2-menu', c ? 'aberto' : 'recolhido'); return !c; });
  useEffect(()=>{ if (window.__DOSAGEM_NATIVE__) return; const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPalette(true)}if(e.key==='Escape'){setPalette(false);setDrawer(false)}}; window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
  if (window.__DOSAGEM_NATIVE__) return <main className="ct-native-main">{children}</main>;
  if (mode === 'desktop') return <div className={`ct-desktop-shell${collapsed ? ' is-collapsed' : ''}`}><Sidebar collapsed={collapsed} onToggle={toggle} counts={counts}/><div className="ct-shell-body"><Topbar title={title} saveStatus={saveStatus} saveMessage={saveMessage} onSearch={()=>setPalette(true)}/><main className="ct-main">{children}</main></div>{palette&&<CommandPalette onClose={()=>setPalette(false)}/>}</div>;
  if (mode === 'tablet') return <div className="ct-tablet-shell">
    <nav className="ct-tablet-rail" aria-label="Navegação principal">
      <button className="ct-icon-button" aria-label="Abrir menu" onClick={()=>setDrawer(true)}><Icon name="menu"/></button>
      {[allNav[0], allNav[1], allNav[2], allNav[3], allNav[7], allNav[8], allNav[10]].map(item => <RailLink key={item.path} item={item}/>)}
    </nav>
    <div className="ct-shell-body"><Topbar compact title={title} saveStatus={saveStatus} saveMessage={saveMessage} onSearch={()=>setPalette(true)}/><main className="ct-main">{children}</main></div>
    {drawer&&<div className="ct-modal-backdrop ct-drawer-backdrop" onClick={()=>setDrawer(false)}><div onClick={e=>e.stopPropagation()}><Sidebar onNavigate={()=>setDrawer(false)} counts={counts}/></div></div>}
    {palette&&<CommandPalette onClose={()=>setPalette(false)}/>}
  </div>;
  return <div className="ct-mobile-shell">
    <header className="ct-mobile-top"><button className="ct-icon-button" aria-label="Voltar" onClick={()=>history.back()}><Icon name="voltar"/></button><strong>{title}</strong><button className="ct-icon-button" aria-label="Buscar telas" onClick={()=>setPalette(true)}><Icon name="busca"/></button><SaveStatusView status={saveStatus} message={saveMessage}/><button type="button" className="ct-icon-button" aria-label="Sair" title="Sair" onClick={() => void sair()}><Icon name="sair" size={18}/></button></header>
    <PilotNotice compact/>
    <main className="ct-mobile-main">{children}</main>
    <MobileNav/>
    {palette&&<CommandPalette onClose={()=>setPalette(false)}/>}
  </div>;
}
function RailLink({ item }: { item: NavItem }) {
  const location = useLocation();
  return <Link to={item.path} className={isActive(item, location.pathname) ? 'active' : ''} aria-current={isActive(item, location.pathname) ? 'page' : undefined}><Icon name={item.icon}/><small>{railLabel(item)}</small></Link>;
}

function railLabel(item: NavItem) { const s = item.short?.replace('Por ', '') ?? item.label; return s.charAt(0).toUpperCase() + s.slice(1); }
