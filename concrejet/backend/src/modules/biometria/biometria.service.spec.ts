import { BadRequestException } from '@nestjs/common';
import { BiometriaService, FACE_EMBEDDING_DIMENSION } from './biometria.service';

describe('BiometriaService status', () => {
  const colaborador = {
    id: 'col-1',
    nome: 'Operador 002',
    matricula: 'OP002',
    empresaId: 'emp-1',
    ativo: true,
  };
  const unidade = {
    id: 'uni-1',
    codigo: 'MATRIZ',
    nome: 'Unidade Matriz',
    empresaId: 'emp-1',
    ativo: true,
  };

  function createService(record?: Record<string, unknown>) {
    const biometriaRepository = {
      findOne: jest.fn().mockResolvedValue(record ?? null),
      update: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 'bio-1' })),
    };
    const eventoRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((value) => value),
    };
    const dataSource = {
      getRepository: jest.fn((entity) => ({
        findOne: jest.fn().mockResolvedValue(entity.name === 'Unidade' ? unidade : colaborador),
      })),
      query: jest.fn().mockResolvedValue([]),
    };
    const configService = {
      get: jest.fn((_key: string, fallback: unknown) => fallback),
    };
    const service = new BiometriaService(
      biometriaRepository as never,
      eventoRepository as never,
      configService as never,
      dataSource as never,
      {} as never,
    );
    return { service, biometriaRepository };
  }

  it('nao retorna incompatibilidade para colaborador sem biometria', async () => {
    const { service } = createService();

    await expect(service.status('col-1')).resolves.toMatchObject({
      ativa: false,
      situacao: 'nao_cadastrada',
      compatibilidade: 'sem_cadastro',
      dimensaoEmbedding: null,
    });
  });

  it('reconhece template valido com a dimensao real do SFace', async () => {
    const { service } = createService({
      ativa: true,
      modeloNome: 'opencv_sface',
      modeloVersao: '2021dec-int8bq',
      qualidade: '0.8600',
      emitidaEm: new Date(),
    });
    jest
      .spyOn(service as unknown as { decrypt: () => string }, 'decrypt')
      .mockReturnValue(JSON.stringify({ embedding: Array(FACE_EMBEDDING_DIMENSION).fill(0.1) }));

    await expect(service.status('col-1')).resolves.toMatchObject({
      ativa: true,
      situacao: 'ativa',
      compatibilidade: 'compativel',
      dimensaoEmbedding: FACE_EMBEDDING_DIMENSION,
    });
  });

  it('marca template legado de dimensao antiga como incompativel', async () => {
    const { service } = createService({
      ativa: true,
      modeloNome: 'opencv_sface',
      modeloVersao: '2021dec-int8bq',
      qualidade: '0.8600',
      emitidaEm: new Date(),
    });
    jest
      .spyOn(service as unknown as { decrypt: () => string }, 'decrypt')
      .mockReturnValue(JSON.stringify({ embedding: [0.1, 0.2] }));

    await expect(service.status('col-1')).resolves.toMatchObject({
      ativa: false,
      situacao: 'incompativel',
      compatibilidade: 'dimensao_incompativel',
      dimensaoEmbedding: 2,
    });
  });

  it('marca versao incompativel como incompativel sem expor codigo tecnico', async () => {
    const { service } = createService({
      ativa: true,
      modeloNome: 'opencv_sface',
      modeloVersao: 'legacy',
      qualidade: '0.8600',
      emitidaEm: new Date(),
    });

    await expect(service.status('col-1')).resolves.toMatchObject({
      ativa: false,
      situacao: 'incompativel',
      compatibilidade: 'modelo_incompativel',
    });
  });

  it('bloqueia cadastro sem unidade explicita', async () => {
    const { service } = createService();
    jest
      .spyOn(service as unknown as { assertAvailable: () => void }, 'assertAvailable')
      .mockReturnValue(undefined);

    await expect(
      service.completeEnrollment('col-1', {
        dispositivoId: 'disp-1',
        qualidade: 0.86,
        samples: [[], [], [], [], []],
        model: { nome: 'opencv_sface', versao: '2021dec-int8bq', dimensao: 128 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
