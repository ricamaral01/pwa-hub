import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { authApi } from '@/api/services';
import { useAdminAuthStore } from '@/store/admin-auth.store';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const refreshSession = useAdminAuthStore((state) => state.refreshSession);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmacao) {
      setError('Preencha todos os campos.');
      return;
    }
    if (novaSenha !== confirmacao) {
      setError('A confirmacao nao confere.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.changePassword({ senhaAtual, novaSenha });
      await refreshSession();
      navigate('/admin', { replace: true });
    } catch {
      setError('Nao foi possivel trocar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-layout" aria-label="Troca obrigatoria de senha">
      <form
        className="login-card login-card-wide"
        onSubmit={(event) => void handleSubmit(event)}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <div>
          <p className="field-label-text">Acesso administrativo</p>
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>Troca obrigatoria de senha</h1>
        </div>

        <Field label="Senha atual" required>
          <Input
            type="password"
            value={senhaAtual}
            onChange={(event) => setSenhaAtual(event.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field label="Nova senha" required>
          <Input
            type="password"
            value={novaSenha}
            onChange={(event) => setNovaSenha(event.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar nova senha" required>
          <Input
            type="password"
            value={confirmacao}
            onChange={(event) => setConfirmacao(event.target.value)}
            autoComplete="new-password"
          />
        </Field>

        {error && (
          <p role="alert" style={{ color: 'var(--color-red-light)', fontSize: 'var(--text-sm)' }}>
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth>
          Alterar senha
        </Button>
      </form>
    </main>
  );
}
