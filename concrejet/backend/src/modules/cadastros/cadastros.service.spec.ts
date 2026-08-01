import { BadRequestException } from '@nestjs/common';
import { CadastrosService } from './cadastros.service';

describe('CadastrosService', () => {
  const user = {
    sub: 'user-1',
    empresaId: 'empresa-1',
    email: 'admin@example.com',
    perfis: ['ADMIN'],
  };

  function makeService(overrides?: { entity?: Record<string, unknown> }) {
    const repo = {
      create: jest.fn((data) => ({ id: 'new-id', ...data })),
      save: jest.fn(async (data) => data),
      findOne: jest.fn(
        async () => overrides?.entity ?? { id: 'id-1', empresaId: user.empresaId, ativo: true },
      ),
    };
    const dataSource = {
      getRepository: jest.fn(() => repo),
      transaction: jest.fn((callback) => callback({ getRepository: () => repo, query: jest.fn() })),
    };
    const permissions = { assertCan: jest.fn(async () => undefined) };
    const auditoria = { registrar: jest.fn(async () => undefined) };
    const service = new CadastrosService(
      dataSource as never,
      permissions as never,
      auditoria as never,
    );
    return { service, repo, permissions, auditoria };
  }

  it('bloqueia campos desconhecidos no create', async () => {
    const { service } = makeService();
    await expect(
      service.create('items', { codigo: 'A', descricao: 'Item A', secreto: 'x' }, user, 'corr-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bloqueia edicao direta do saldo de lote de resina', async () => {
    const { service } = makeService();
    await expect(
      service.update('resin-lots', 'id-1', { saldoAtualKg: 10 }, user, 'corr-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('usa permissao especifica do recurso e acao', async () => {
    const { service, permissions } = makeService();
    await service.create('items', { codigo: 'A', descricao: 'Item A' }, user, 'corr-1');
    expect(permissions.assertCan).toHaveBeenCalledWith(user.sub, 'itens.criar');
  });
});
