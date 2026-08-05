import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function DesktopShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="desktop-shell">
      <DesktopSidebar />
      <section className="desktop-main">
        <DesktopHeader title={title} actions={actions} />
        <div className="desktop-content">{children}</div>
      </section>
    </main>
  );
}

export function DesktopSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const groups = useMemo(
    () =>
      [
        ['Visao geral', [['Dashboard', '/admin/dashboard', '▦']]],
        [
          'Producao',
          [
            ['Apontamentos', '/admin/history/production', '▤'],
            ['Ordens de producao', '/admin/cadastros/production-orders', '▣'],
            ['Itens', '/admin/cadastros/items', '◆'],
            ['Moldes', '/admin/cadastros/molds', '◇'],
            ['Configuracoes item-molde', '/admin/cadastros/item-mold-configurations', '⚙'],
          ],
        ],
        [
          'Pessoas',
          [
            ['Colaboradores', '/admin/cadastros/collaborators', '●'],
            ['Funcoes', '/admin/cadastros/functions', '◌'],
          ],
        ],
        ['Equipamentos', [['Maquinas', '/admin/cadastros/machines', '▥']]],
        [
          'Materiais',
          [
            ['Estoque', '/admin/stock', '▧'],
            ['Resinas', '/admin/cadastros/resins', '◼'],
            ['Lotes de resina', '/admin/cadastros/resin-lots', '▨'],
            ['Fornecedores', '/admin/cadastros/suppliers', '▱'],
            ['Blendas', '/admin/blends', '◩'],
          ],
        ],
        [
          'Operacao',
          [
            ['Operacoes', '/admin/cadastros/operations', '▶'],
            ['Tipos de ocorrencia', '/admin/cadastros/occurrence-types', '▲'],
            ['Paradas e ocorrencias', '/admin/history/occurrences', '■'],
          ],
        ],
        [
          'Analises',
          [
            ['Producao', '/admin/analytics/production', '▤'],
            ['Perdas', '/admin/analytics/losses', '▥'],
            ['Paradas', '/admin/analytics/stops', '■'],
            ['OEE', '/admin/analytics/oee', '◎'],
            ['Estoque', '/admin/analytics/stock', '▧'],
            ['Rastreabilidade', '/admin/traceability', '⌕'],
          ],
        ],
        [
          'Sistema',
          [
            ['Importacao historica', '/admin/imports', '⇣'],
            ['Conflitos de sincronizacao', '/admin/sync-conflicts', '⚠'],
          ],
        ],
      ] as const,
    [],
  );

  return (
    <aside className={`desktop-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="desktop-brand">
        <div>
          <strong>ConcreTrack</strong>
          <span>Injecao</span>
        </div>
        <button
          type="button"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <div className="desktop-sidebar-scroll">
        {groups.map(([group, items]) => (
          <SidebarGroup key={group} title={group} collapsed={collapsed}>
            {items.map(([label, to, icon]) => (
              <SidebarItem
                key={to}
                to={to}
                label={label}
                icon={icon}
                active={location.pathname === to}
              />
            ))}
          </SidebarGroup>
        ))}
      </div>
      <div className="desktop-sidebar-footer">Ambiente local</div>
    </aside>
  );
}

export function SidebarGroup({
  title,
  children,
  collapsed,
}: {
  title: string;
  children: ReactNode;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <nav className="sidebar-group">
      {!collapsed ? (
        <button type="button" onClick={() => setOpen((value) => !value)}>
          <span>{title}</span>
          <b>{open ? '-' : '+'}</b>
        </button>
      ) : null}
      {open || collapsed ? <div className="sidebar-items">{children}</div> : null}
    </nav>
  );
}

export function SidebarItem({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      className={active ? 'active' : ''}
      to={to}
      title={label}
      aria-current={active ? 'page' : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      <strong>{label}</strong>
    </Link>
  );
}

export function DesktopHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="desktop-header">
      <div>
        <span>ConcreTrack Injecao</span>
        <h1>{title}</h1>
      </div>
      <div className="desktop-header-actions">{actions}</div>
    </header>
  );
}

export function DesktopToolbar({ children }: { children: ReactNode }) {
  return <div className="desktop-toolbar">{children}</div>;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">{children}</table>
    </div>
  );
}

export function Pagination({ total }: { total: number }) {
  return <div className="pagination">Total de registros: {total}</div>;
}

export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi-card">
      <span>{label}</span>
      <strong className="num">{value}</strong>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="chart-panel">
      <h2>{title}</h2>
      {children}
    </article>
  );
}
