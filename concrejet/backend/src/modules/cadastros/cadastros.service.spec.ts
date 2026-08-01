import { BadRequestException, ConflictException } from '@nestjs/common';
import { CadastrosService } from './cadastros.service';
import { Fornecedor, LoteResina, MovimentoEstoqueLote, Resina } from './entities';

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

describe('CadastrosService resin lots', () => {
  const user = {
    sub: 'user-1',
    empresaId: 'empresa-1',
    email: 'admin@example.com',
    perfis: ['ADMIN'],
  };
  const resinaId = '11111111-1111-4111-8111-111111111111';
  const fornecedorId = '22222222-2222-4222-8222-222222222222';

  function makeService(options?: {
    existingLot?: boolean;
    resinExists?: boolean;
    supplierExists?: boolean;
  }) {
    const lotRepo = {
      create: jest.fn((data) => ({ id: 'lot-1', ...data })),
      save: jest.fn(async (data) => ({ id: 'lot-1', ...data })),
      findOne: jest.fn(async () => (options?.existingLot ? { id: 'lot-existing' } : null)),
    };
    const resinRepo = {
      findOne: jest.fn(async () => (options?.resinExists === false ? null : { id: resinaId })),
    };
    const supplierRepo = {
      findOne: jest.fn(async () =>
        options?.supplierExists === false ? null : { id: fornecedorId },
      ),
    };
    const movementRepo = {
      create: jest.fn((data) => ({ id: 'mov-1', ...data })),
      save: jest.fn(async (data) => data),
    };
    const manager = {
      query: jest.fn(async () => undefined),
      getRepository: jest.fn((entity) => {
        if (entity === LoteResina) return lotRepo;
        if (entity === Resina) return resinRepo;
        if (entity === Fornecedor) return supplierRepo;
        if (entity === MovimentoEstoqueLote) return movementRepo;
        return lotRepo;
      }),
    };
    const dataSource = {
      getRepository: jest.fn(() => lotRepo),
      transaction: jest.fn((callback) => callback(manager)),
    };
    const permissions = { assertCan: jest.fn(async () => undefined) };
    const auditoria = { registrar: jest.fn(async () => undefined) };
    const service = new CadastrosService(
      dataSource as never,
      permissions as never,
      auditoria as never,
    );
    return { service, lotRepo, resinRepo, supplierRepo, movementRepo };
  }

  const validPayload = {
    codigo: 'LOTE-001',
    resinaId,
    fornecedorId,
    origem: 'COMPRA',
    quantidadeInicialKg: 25,
    dataRecebimento: '2026-08-01',
    validade: '2027-08-01',
    custoPorKg: 12.5,
    status: 'DISPONIVEL',
    ativo: true,
  };

  it('cria lote valido com saldo inicial igual a quantidade inicial', async () => {
    const { service, lotRepo, movementRepo } = makeService();
    const saved = await service.create('resin-lots', validPayload, user, 'corr-1');
    expect((saved as unknown as LoteResina).saldoAtualKg).toBe(
      String(validPayload.quantidadeInicialKg),
    );
    expect(lotRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ saldoAtualKg: '25', resinaId, fornecedorId }),
    );
    expect(movementRepo.save).toHaveBeenCalledWith(expect.objectContaining({ quantidadeKg: '25' }));
  });

  it('rejeita resina inexistente', async () => {
    const { service } = makeService({ resinExists: false });
    await expect(service.create('resin-lots', validPayload, user, 'corr-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita fornecedor inexistente', async () => {
    const { service } = makeService({ supplierExists: false });
    await expect(service.create('resin-lots', validPayload, user, 'corr-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita UUID invalido', async () => {
    const { service } = makeService();
    await expect(
      service.create('resin-lots', { ...validPayload, resinaId: 'teste' }, user, 'corr-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita quantidade negativa', async () => {
    const { service } = makeService();
    await expect(
      service.create('resin-lots', { ...validPayload, quantidadeInicialKg: -1 }, user, 'corr-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita codigo duplicado com conflito compreensivel', async () => {
    const { service } = makeService({ existingLot: true });
    await expect(service.create('resin-lots', validPayload, user, 'corr-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejeita saldo enviado pelo cliente na criacao', async () => {
    const { service } = makeService();
    await expect(
      service.create('resin-lots', { ...validPayload, saldoAtualKg: 1 }, user, 'corr-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
