import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { useAdminAuthStore } from '@/store/admin-auth.store';

export default function AdminHomePage() {
  const navigate = useNavigate();
  const user = useAdminAuthStore((state) => state.user);
  const logout = useAdminAuthStore((state) => state.logout);
  const isLoading = useAdminAuthStore((state) => state.isLoading);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main
      aria-label="Painel administrativo"
      style={{ minHeight: '100vh', padding: 'var(--space-8)', background: 'var(--bg-primary)' }}
    >
      <section style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="field-label-text">Sessao administrativa</p>
            <h1>Painel administrativo</h1>
          </div>
          <Button
            type="button"
            variant="surface"
            loading={isLoading}
            onClick={() => void handleLogout()}
          >
            Sair
          </Button>
        </div>

        <div
          role="list"
          style={{
            display: 'grid',
            gap: 'var(--space-3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={rowStyle} role="listitem">
            <span>Nome</span>
            <strong>{user?.nome}</strong>
          </div>
          <div style={rowStyle} role="listitem">
            <span>E-mail</span>
            <strong>{user?.email}</strong>
          </div>
          <div style={rowStyle} role="listitem">
            <span>Perfis</span>
            <strong>{user?.perfis.join(', ')}</strong>
          </div>
        </div>
        <Link
          className="btn btn-md btn-primary"
          to="/admin/cadastros/items"
          style={{ textDecoration: 'none', justifySelf: 'start' }}
        >
          Cadastros
        </Link>
      </section>
    </main>
  );
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-3) 0',
  borderBottom: '1px solid var(--border-subtle)',
} satisfies CSSProperties;
