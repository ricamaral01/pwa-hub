import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CadastrosPage from './CadastrosPage';
import * as api from '@/features/cadastros/api';

vi.mock('@/features/cadastros/api');

function renderPage(path = '/admin/cadastros/items') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/cadastros/:resource" element={<CadastrosPage />} />
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
});
