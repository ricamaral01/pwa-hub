import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CadastrosPage from './CadastrosPage';
import * as api from '@/features/cadastros/api';
import * as client from '@/api/client';

vi.mock('@/features/cadastros/api');
vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  getApiErrorMessage: vi.fn(() => 'Erro de API'),
}));

function renderPage(path = '/admin/cadastros/items') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/cadastros/:resource" element={<CadastrosPage />} />
          <Route
            path="/admin/cadastros/colaboradores/:id/biometria"
            element={<div>Biometria</div>}
          />
          <Route path="/admin" element={<div>Admin</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CadastrosPage', () => {
  beforeEach(() => {
    vi.mocked(api.listCadastros).mockResolvedValue({
      data: [{ id: 'item-1', codigo: 'ITEM-001', descricao: 'Item existente', ativo: true }],
      meta: { page: 1, limit: 50, total: 1 },
    });
    vi.mocked(api.createCadastro).mockResolvedValue({ id: 'item-2', codigo: 'ITEM-002' });
    vi.mocked(api.updateCadastro).mockResolvedValue({ id: 'item-1' });
    vi.mocked(api.inactivateCadastro).mockResolvedValue({ id: 'item-1', ativo: false });
    vi.mocked(api.reactivateCadastro).mockResolvedValue({ id: 'item-1', ativo: true });
    vi.mocked(client.apiGet).mockResolvedValue({
      ativa: true,
      modeloNome: 'opencv_sface',
      modeloVersao: '2021dec-int8bq',
      emitidaEm: '2026-08-01T10:00:00.000Z',
    });
  });

  it('lista e cria cadastro usando o recurso da rota', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Itens' })).toBeInTheDocument();
    expect(await screen.findByText('ITEM-001')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Codigo'), { target: { value: 'ITEM-002' } });
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Novo item' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => {
      expect(api.createCadastro).toHaveBeenCalledWith('items', {
        codigo: 'ITEM-002',
        descricao: 'Novo item',
        ativo: true,
      });
    });
  });

  it('exibe colaboradores com funcao amigavel e acesso a biometria', async () => {
    vi.mocked(api.listCadastros).mockImplementation((resource) =>
      Promise.resolve(
        resource === 'functions'
          ? {
              data: [{ id: 'funcao-1', codigo: 'OP', descricao: 'Operador', ativo: true }],
              meta: { page: 1, limit: 50, total: 1 },
            }
          : {
              data: [
                {
                  id: 'colaborador-1',
                  matricula: 'OP001',
                  nome: 'Ana Silva',
                  funcaoId: 'funcao-1',
                  ativo: true,
                },
              ],
              meta: { page: 1, limit: 50, total: 1 },
            },
      ),
    );

    renderPage('/admin/cadastros/collaborators');

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(await screen.findByText('OP - Operador')).toBeInTheDocument();
    expect(screen.queryByText('funcao-1')).not.toBeInTheDocument();
    expect(screen.queryByText(/identificador interno/i)).not.toBeInTheDocument();
    expect(await screen.findByText('Ativa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /biometria facial/i }));
    expect(await screen.findByText('Biometria')).toBeInTheDocument();
  });

  it('usa select de funcoes no cadastro de colaborador', async () => {
    vi.mocked(api.listCadastros).mockImplementation((resource) =>
      Promise.resolve(
        resource === 'functions'
          ? {
              data: [{ id: 'funcao-1', codigo: 'OP', descricao: 'Operador', ativo: true }],
              meta: { page: 1, limit: 50, total: 1 },
            }
          : { data: [], meta: { page: 1, limit: 50, total: 0 } },
      ),
    );

    renderPage('/admin/cadastros/collaborators');

    fireEvent.click(await screen.findByRole('button', { name: /novo colaborador/i }));
    expect(await screen.findByRole('option', { name: 'OP - Operador' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/funcao id/i)).not.toBeInTheDocument();
  });
  it('usa seletores reais para criar lote de resina', async () => {
    vi.mocked(api.listCadastros).mockImplementation((resource) =>
      Promise.resolve(
        (() => {
          if (resource === 'resins') {
            return {
              data: [{ id: 'resina-1', codigo: 'PP', descricao: 'Polipropileno', ativo: true }],
              meta: { page: 1, limit: 50, total: 1 },
            };
          }
          if (resource === 'suppliers') {
            return {
              data: [{ id: 'fornecedor-1', documento: '123', nome: 'Fornecedor A', ativo: true }],
              meta: { page: 1, limit: 50, total: 1 },
            };
          }
          return { data: [], meta: { page: 1, limit: 50, total: 0 } };
        })(),
      ),
    );
    vi.mocked(api.createCadastro).mockResolvedValue({ id: 'lote-1', codigo: 'LOTE-001' });

    renderPage('/admin/cadastros/resin-lots');

    expect(await screen.findByRole('heading', { name: 'Lotes de resina' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'PP - Polipropileno' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: '123 - Fornecedor A' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Codigo do lote'), { target: { value: 'LOTE-001' } });
    fireEvent.change(screen.getByLabelText('Resina'), { target: { value: 'resina-1' } });
    fireEvent.change(screen.getByLabelText('Fornecedor'), { target: { value: 'fornecedor-1' } });
    fireEvent.change(screen.getByLabelText('Quantidade inicial kg'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Data de recebimento'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => {
      expect(api.createCadastro).toHaveBeenCalledWith(
        'resin-lots',
        expect.objectContaining({
          codigo: 'LOTE-001',
          resinaId: 'resina-1',
          fornecedorId: 'fornecedor-1',
          origem: 'COMPRA',
          quantidadeInicialKg: 50,
          dataRecebimento: '2026-08-01',
          status: 'DISPONIVEL',
          ativo: true,
        }),
      );
    });
  });
});
