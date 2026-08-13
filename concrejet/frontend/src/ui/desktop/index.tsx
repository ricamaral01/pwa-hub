import type { ReactNode } from 'react';
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
        {children}
      </section>
    </main>
  );
}

export function DesktopSidebar() {
  const location = useLocation();
  const groups = [
    [
      'Produção',
      [
        ['Itens', 'items'],
        ['Moldes', 'molds'],
        ['Configurações item-molde', 'item-mold-configurations'],
        ['Ordens de produção', 'production-orders'],
      ],
    ],
    [
      'Pessoas',
      [
        ['Funções', 'functions'],
        ['Colaboradores', 'collaborators'],
      ],
    ],
    ['Equipamentos', [['Máquinas', 'machines']]],
    [
      'Materiais',
      [
        ['Resinas', 'resins'],
        ['Fornecedores', 'suppliers'],
        ['Lotes de resina', 'resin-lots'],
      ],
    ],
    [
      'Estoque',
      [
        ['Movimentos', '../stock'],
        ['Blendas', '../blends'],
        ['Rastreabilidade', '../traceability'],
      ],
    ],
    [
      'Analytics',
      [
        ['Dashboard', '../dashboard'],
        ['Producao', '../analytics/production'],
        ['Perdas', '../analytics/losses'],
        ['Paradas', '../analytics/stops'],
        ['OEE', '../analytics/oee'],
        ['Estoque', '../analytics/stock'],
      ],
    ],
    [
      'Historico',
      [
        ['Apontamentos', '../history/production'],
        ['Ocorrencias', '../history/occurrences'],
        ['Movimentos', '../history/stock'],
        ['Blendas', '../history/blends'],
        ['Importacao', '../imports'],
      ],
    ],
    [
      'Configurações',
      [
        ['Operações', 'operations'],
        ['Tipos de ocorrência', 'occurrence-types'],
      ],
    ],
  ] as const;
  return (
    <aside className="desktop-sidebar">
      <strong>ConcreTrack</strong>
      {groups.map(([group, items]) => (
        <nav key={group}>
          <span>{group}</span>
          {items.map(([label, slug]) => {
            const to = slug.startsWith('../')
              ? `/admin/${slug.slice(3)}`
              : `/admin/cadastros/${slug}`;
            return (
              <Link key={slug} className={location.pathname === to ? 'active' : ''} to={to}>
                {label}
              </Link>
            );
          })}
        </nav>
      ))}
    </aside>
  );
}

export function DesktopHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="desktop-header">
      <h1>{title}</h1>
      {actions}
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
