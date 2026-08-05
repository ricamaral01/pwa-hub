import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FaceEnrollmentPage from './FaceEnrollmentPage';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import * as client from '@/api/client';
import { authApi } from '@/api/services';
import * as cadastrosApi from '@/features/cadastros/api';

vi.mock('@/api/client');
vi.mock('@/api/services', () => ({
  authApi: {
    faceReadiness: vi.fn(),
  },
}));
vi.mock('@/features/cadastros/api');

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/cadastros/colaboradores/colaborador-1/biometria']}>
        <Routes>
          <Route
            path="/admin/cadastros/colaboradores/:id/biometria"
            element={<FaceEnrollmentPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FaceEnrollmentPage', () => {
  beforeEach(() => {
    useAdminAuthStore.setState({
      user: {
        id: 'admin-1',
        nome: 'Admin',
        email: 'admin@example.com',
        empresaId: 'empresa-1',
        deveTrocarSenha: false,
        perfis: ['ADMIN'],
      },
      status: 'authenticated',
    });
    vi.mocked(client.apiGet).mockImplementation((url: string) => {
      if (url.includes('/collaborators/')) {
        return Promise.resolve({
          id: 'colaborador-1',
          matricula: 'OP001',
          nome: 'Ana Silva',
          funcaoId: 'funcao-1',
          ativo: true,
        });
      }
      return Promise.resolve({
        ativa: false,
        modeloNome: null,
        modeloVersao: null,
        qualidade: null,
        ultimaUtilizacaoEm: null,
        emitidaEm: null,
      });
    });
    vi.mocked(client.apiPost).mockResolvedValue({});
    vi.mocked(client.apiDelete).mockResolvedValue({});
    vi.mocked(client.getApiErrorMessage).mockReturnValue('Erro de API');
    vi.mocked(authApi.faceReadiness).mockResolvedValue({
      enabled: true,
      available: true,
      httpsReady: null,
      encryptionReady: true,
      modelReady: true,
      governanceReady: true,
      databaseReady: true,
      permissionsReady: true,
      cameraSupported: null,
      reasons: [],
      model: {
        nome: 'opencv_sface',
        versao: '2021dec-int8bq',
        dimensao: 128,
        metrica: 'cosine',
        threshold: 0.363,
        margemMinima: 0.05,
        qualidadeMinima: 0.6,
      },
    });
    vi.mocked(cadastrosApi.listCadastros).mockResolvedValue({
      data: [{ id: 'funcao-1', codigo: 'OP', descricao: 'Operador', ativo: true }],
      meta: { page: 1, limit: 50, total: 1 },
    });
  });

  it('mostra colaborador sem biometria e inicia cadastro', async () => {
    renderPage();

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(await screen.findByText('OP - Operador')).toBeInTheDocument();
    expect(await screen.findAllByText('Nao cadastrada')).not.toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: /cadastrar biometria/i }));

    await waitFor(() => {
      expect(client.apiPost).toHaveBeenCalledWith(
        '/employees/colaborador-1/face-enrollment/complete',
        expect.objectContaining({ qualidade: 0.86 }),
      );
    });
  });

  it('mostra biometria ativa, revoga e exclui com confirmacao', async () => {
    vi.mocked(client.apiGet).mockImplementation((url: string) => {
      if (url.includes('/collaborators/')) {
        return Promise.resolve({
          id: 'colaborador-1',
          matricula: 'OP001',
          nome: 'Ana Silva',
          funcaoId: 'funcao-1',
          ativo: true,
        });
      }
      return Promise.resolve({
        ativa: true,
        modeloNome: 'opencv_sface',
        modeloVersao: '2021dec-int8bq',
        qualidade: '0.8600',
        ultimaUtilizacaoEm: null,
        emitidaEm: '2026-08-01T10:00:00.000Z',
      });
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();

    expect(await screen.findAllByText('Ativa')).not.toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Revogar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(client.apiPost).toHaveBeenCalledWith(
        '/employees/colaborador-1/face-enrollment/revoke',
        {
          motivo: 'revogacao administrativa',
        },
      );
      expect(client.apiDelete).toHaveBeenCalledWith('/employees/colaborador-1/face-enrollment');
    });
  });

  it('desabilita cadastro quando readiness esta indisponivel', async () => {
    vi.mocked(authApi.faceReadiness).mockResolvedValueOnce({
      enabled: true,
      available: false,
      httpsReady: null,
      encryptionReady: false,
      modelReady: true,
      governanceReady: true,
      databaseReady: true,
      permissionsReady: true,
      cameraSupported: null,
      reasons: ['chave_criptografia_ausente'],
      model: {
        nome: 'opencv_sface',
        versao: '2021dec-int8bq',
        dimensao: 128,
        metrica: 'cosine',
        threshold: 0.363,
        margemMinima: 0.05,
        qualidadeMinima: 0.6,
      },
    });

    renderPage();

    expect(await screen.findByText('Chave de criptografia ausente.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar biometria/i })).toBeDisabled();
  });
});
