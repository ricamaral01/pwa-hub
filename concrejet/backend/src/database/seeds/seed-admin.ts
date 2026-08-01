import 'reflect-metadata';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Empresa } from '../../modules/organizacao/entities/empresa.entity';
import { Unidade } from '../../modules/organizacao/entities/unidade.entity';
import { Usuario } from '../../modules/usuarios/entities/usuario.entity';
import { Perfil } from '../../modules/usuarios/entities/perfil.entity';
import { Permissao } from '../../modules/usuarios/entities/permissao.entity';
import {
  Colaborador,
  ConfiguracaoItemMolde,
  Funcao,
  Item,
  LoteResina,
  Molde,
  MovimentoEstoqueLote,
  Operacao,
  OrdemProducao,
  TipoOcorrencia,
  Fornecedor,
  Resina,
} from '../../modules/cadastros/entities';
import { Maquina } from '../../modules/producao-base/entities/maquina.entity';
import { Dispositivo } from '../../modules/producao-base/entities/dispositivo.entity';

const ADMIN_PERFIL_CODIGO = 'ADMIN';
const ADMIN_PERMISSAO_CHAVE = 'sistema.administrar';
const FASE1_RECURSOS = [
  'funcoes',
  'colaboradores',
  'maquinas',
  'operacoes',
  'tipos_ocorrencia',
  'fornecedores',
  'resinas',
  'lotes_resina',
  'itens',
  'moldes',
  'configuracoes_item_molde',
  'ordens_producao',
];
const FASE1_ACOES = ['consultar', 'criar', 'editar', 'inativar', 'reativar'];
const FASE2_PERMISSOES = [
  'operadores.autenticar',
  'apontamentos.consultar',
  'apontamentos.criar',
  'apontamentos.iniciar',
  'apontamentos.alterar',
  'apontamentos.concluir',
  'apontamentos.cancelar',
  'apontamentos.consultar_historico',
  'ocorrencias.consultar',
  'ocorrencias.criar',
  'ocorrencias.iniciar',
  'ocorrencias.alterar',
  'ocorrencias.encerrar',
  'ocorrencias.cancelar',
  'ocorrencias.aprovar',
  'ocorrencias.consultar_historico',
  'estoque.consultar',
  'estoque.entrada',
  'estoque.ajustar',
  'estoque.estornar',
  'estoque.transferir',
  'estoque.rastrear',
  'blendas.consultar',
  'blendas.criar',
  'blendas.alterar',
  'blendas.concluir',
  'blendas.cancelar',
  'blendas.rastrear',
  'dashboard.visualizar',
  'relatorios.producao',
  'relatorios.perdas',
  'relatorios.paradas',
  'relatorios.oee',
  'relatorios.estoque',
  'relatorios.exportar',
  'rastreabilidade.consultar',
  'historico.consultar',
  'analytics.atualizar',
  'importacao.consultar',
  'importacao.criar',
  'importacao.mapear',
  'importacao.validar',
  'importacao.executar',
  'importacao.reprocessar',
  'importacao.reverter',
  'importacao.exportar_relatorio',
];

function generateRandomPassword(): string {
  return randomBytes(18).toString('base64url');
}

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    throw new Error('SEED_ADMIN_EMAIL não definido. Configure a variável antes de rodar o seed.');
  }

  let senhaGerada: string | null = null;
  let senha = process.env.SEED_ADMIN_PASSWORD;
  if (!senha) {
    senha = generateRandomPassword();
    senhaGerada = senha;
  }

  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    const empresaRepo = manager.getRepository(Empresa);
    const unidadeRepo = manager.getRepository(Unidade);
    const perfilRepo = manager.getRepository(Perfil);
    const permissaoRepo = manager.getRepository(Permissao);
    const usuarioRepo = manager.getRepository(Usuario);

    let empresa = await empresaRepo.findOne({ where: { cnpj: '00000000000000' } });
    if (!empresa) {
      empresa = await empresaRepo.save(
        empresaRepo.create({
          razaoSocial: 'Empresa Padrão (seed)',
          cnpj: '00000000000000',
          ativo: true,
        }),
      );
    }

    let unidade = await unidadeRepo.findOne({
      where: { empresaId: empresa.id, codigo: 'MATRIZ' },
    });
    if (!unidade) {
      unidade = await unidadeRepo.save(
        unidadeRepo.create({
          empresaId: empresa.id,
          codigo: 'MATRIZ',
          nome: 'Unidade Matriz',
          ativo: true,
        }),
      );
    }

    let permissao = await permissaoRepo.findOne({ where: { chave: ADMIN_PERMISSAO_CHAVE } });
    if (!permissao) {
      permissao = await permissaoRepo.save(
        permissaoRepo.create({
          chave: ADMIN_PERMISSAO_CHAVE,
          descricao: 'Administração completa do sistema',
          modulo: 'sistema',
        }),
      );
    }
    const fase1Permissoes: Permissao[] = [];
    for (const recurso of FASE1_RECURSOS) {
      for (const acao of FASE1_ACOES) {
        const chave = `${recurso}.${acao}`;
        let fase1Permissao = await permissaoRepo.findOne({ where: { chave } });
        if (!fase1Permissao) {
          fase1Permissao = await permissaoRepo.save(
            permissaoRepo.create({
              chave,
              descricao: `Permite ${acao} ${recurso}`,
              modulo: 'cadastros',
            }),
          );
        }
        fase1Permissoes.push(fase1Permissao);
      }
    }
    const fase2Permissoes: Permissao[] = [];
    for (const chave of FASE2_PERMISSOES) {
      let fase2Permissao = await permissaoRepo.findOne({ where: { chave } });
      if (!fase2Permissao) {
        fase2Permissao = await permissaoRepo.save(
          permissaoRepo.create({
            chave,
            descricao: `Permite ${chave.replace('.', ' ')}`,
            modulo: 'producao',
          }),
        );
      }
      fase2Permissoes.push(fase2Permissao);
    }

    let perfil = await perfilRepo.findOne({
      where: { empresaId: empresa.id, codigo: ADMIN_PERFIL_CODIGO },
      relations: ['permissoes'],
    });
    if (!perfil) {
      perfil = await perfilRepo.save(
        perfilRepo.create({
          empresaId: empresa.id,
          codigo: ADMIN_PERFIL_CODIGO,
          nome: 'Administrador',
          descricao: 'Perfil com acesso administrativo completo',
          ativo: true,
          permissoes: [permissao, ...fase1Permissoes, ...fase2Permissoes],
        }),
      );
    } else {
      const chavesAtuais = new Set((perfil.permissoes ?? []).map((item) => item.chave));
      const novasPermissoes = [permissao, ...fase1Permissoes, ...fase2Permissoes].filter(
        (item) => !chavesAtuais.has(item.chave),
      );
      if (novasPermissoes.length) {
        perfil.permissoes = [...(perfil.permissoes ?? []), ...novasPermissoes];
        await perfilRepo.save(perfil);
      }
    }

    let perfilOperador = await perfilRepo.findOne({
      where: { empresaId: empresa.id, codigo: 'OPERADOR' },
      relations: ['permissoes'],
    });
    if (!perfilOperador) {
      perfilOperador = await perfilRepo.save(
        perfilRepo.create({
          empresaId: empresa.id,
          codigo: 'OPERADOR',
          nome: 'Operador',
          descricao: 'Perfil operacional do posto',
          ativo: true,
          permissoes: fase2Permissoes,
        }),
      );
    } else {
      const chavesAtuais = new Set((perfilOperador.permissoes ?? []).map((item) => item.chave));
      const novasPermissoes = fase2Permissoes.filter((item) => !chavesAtuais.has(item.chave));
      if (novasPermissoes.length) {
        perfilOperador.permissoes = [...(perfilOperador.permissoes ?? []), ...novasPermissoes];
        await perfilRepo.save(perfilOperador);
      }
    }

    await seedFase1Basico(manager, empresa.id, unidade.id, senhaGerada !== null);

    const usuarioExistente = await usuarioRepo.findOne({ where: { empresaId: empresa.id, email } });
    if (usuarioExistente) {
      // eslint-disable-next-line no-console
      console.log(`Usuário admin ${email} já existe. Nenhuma ação realizada.`);
      return;
    }

    const senhaHash = await argon2.hash(senha!, { type: argon2.argon2id });

    await usuarioRepo.save(
      usuarioRepo.create({
        empresaId: empresa.id,
        unidadeId: unidade.id,
        nome: 'Administrador do Sistema',
        email,
        senhaHash,
        deveTrocarSenha: true,
        ativo: true,
        perfis: [perfil!],
      }),
    );

    // eslint-disable-next-line no-console
    console.log(`Usuário admin criado: ${email}`);
    if (senhaGerada) {
      // eslint-disable-next-line no-console
      console.log(
        `Senha gerada automaticamente (exibida apenas uma vez, troque no primeiro acesso): ${senhaGerada}`,
      );
    }
  });

  await AppDataSource.destroy();
}

async function seedFase1Basico(
  manager: EntityManager,
  empresaId: string,
  unidadeId: string,
  podeImprimirPin: boolean,
) {
  const funcao = await manager.getRepository(Funcao).save(
    await upsertAndReturn(
      manager,
      Funcao,
      { empresaId, codigo: 'OP-INJ' },
      {
        empresaId,
        codigo: 'OP-INJ',
        descricao: 'Operador de injecao',
        ativo: true,
      },
    ),
  );
  await manager.getRepository(Operacao).save(
    await upsertAndReturn(
      manager,
      Operacao,
      { empresaId, codigo: 'INJ' },
      {
        empresaId,
        codigo: 'INJ',
        descricao: 'Injecao plastica',
        ativo: true,
      },
    ),
  );
  await manager.getRepository(TipoOcorrencia).upsert(
    {
      empresaId,
      codigo: 'PARADA',
      descricao: 'Parada de maquina',
      classificacaoPadrao: 'nao_produtiva',
      programacaoPadrao: 'nao_programada',
      entraCalculoOee: true,
      exigeAcaoCorretiva: false,
      exigeAprovacao: false,
      ativo: true,
    },
    ['empresaId', 'codigo'],
  );
  await manager.getRepository(TipoOcorrencia).upsert(
    {
      empresaId,
      codigo: 'MANUT-ACAO',
      descricao: 'Manutencao com acao obrigatoria',
      classificacaoPadrao: 'nao_produtiva',
      programacaoPadrao: 'nao_programada',
      entraCalculoOee: true,
      exigeAcaoCorretiva: true,
      exigeAprovacao: false,
      ativo: true,
    },
    ['empresaId', 'codigo'],
  );
  const fornecedor = await manager.getRepository(Fornecedor).save(
    await upsertAndReturn(
      manager,
      Fornecedor,
      { empresaId, documento: '00000000000000' },
      {
        empresaId,
        nome: 'Fornecedor Padrao',
        documento: '00000000000000',
        ativo: true,
      },
    ),
  );
  const resina = await manager.getRepository(Resina).save(
    await upsertAndReturn(
      manager,
      Resina,
      { empresaId, codigo: 'PP-HOMO' },
      {
        empresaId,
        codigo: 'PP-HOMO',
        descricao: 'Polipropileno homopolimero',
        fabricante: 'Padrao',
        ativo: true,
      },
    ),
  );
  const item = await manager.getRepository(Item).save(
    await upsertAndReturn(
      manager,
      Item,
      { empresaId, codigo: 'ITEM-001' },
      {
        empresaId,
        codigo: 'ITEM-001',
        descricao: 'Item de desenvolvimento',
        ativo: true,
      },
    ),
  );
  const molde = await manager.getRepository(Molde).save(
    await upsertAndReturn(
      manager,
      Molde,
      { empresaId, codigo: 'MOLDE-001' },
      {
        empresaId,
        codigo: 'MOLDE-001',
        descricao: 'Molde de desenvolvimento',
        ativo: true,
      },
    ),
  );
  const colaboradorRepo = manager.getRepository(Colaborador);
  const operadorExistente = await colaboradorRepo
    .createQueryBuilder('colaborador')
    .addSelect('colaborador.pinHash')
    .where('colaborador.empresaId = :empresaId', { empresaId })
    .andWhere('colaborador.matricula = :matricula', { matricula: 'OP001' })
    .getOne();
  const { pinHash: pinHashExistente, ...operadorPersistivel } = operadorExistente ?? {};
  await colaboradorRepo.save(
    colaboradorRepo.create({
      ...operadorPersistivel,
      empresaId,
      matricula: 'OP001',
      nome: 'Operador Desenvolvimento',
      funcaoId: funcao.id,
      ...(pinHashExistente
        ? {}
        : {
            pinHash: await argon2.hash(process.env.SEED_OPERATOR_PIN ?? '2468', {
              type: argon2.argon2id,
            }),
          }),
      ativo: true,
    }),
  );
  const maquina = await manager.getRepository(Maquina).save(
    await upsertAndReturn(
      manager,
      Maquina,
      { unidadeId, codigo: 'INJ-01' },
      {
        unidadeId,
        codigo: 'INJ-01',
        nome: 'Injetora 01',
        modelo: 'Desenvolvimento',
        ativo: true,
      },
    ),
  );
  await manager.getRepository(Dispositivo).save(
    await upsertAndReturn(
      manager,
      Dispositivo,
      { identificador: 'DEV-TABLET-01' },
      {
        identificador: 'DEV-TABLET-01',
        nome: 'Tablet desenvolvimento',
        tipo: 'tablet',
        maquinaId: maquina.id,
        ativo: true,
      },
    ),
  );
  let configuracao = await manager.getRepository(ConfiguracaoItemMolde).findOne({
    where: {
      empresaId,
      itemId: item.id,
      moldeId: molde.id,
      ativo: true,
    },
  });
  if (!configuracao) {
    configuracao = await manager.getRepository(ConfiguracaoItemMolde).save(
      manager.getRepository(ConfiguracaoItemMolde).create({
        empresaId,
        itemId: item.id,
        moldeId: molde.id,
        pesoPecaG: '152.200',
        cicloPadraoSegundos: 45,
        cavidades: 1,
        limitePerdaPercentual: '7.00',
        vigenciaInicio: new Date(),
        ativo: true,
      }),
    );
  }
  let lote = await manager.getRepository(LoteResina).findOne({
    where: { empresaId, codigo: 'LOTE-DEV-001' },
  });
  if (!lote) {
    lote = await manager.getRepository(LoteResina).save(
      manager.getRepository(LoteResina).create({
        empresaId,
        codigo: 'LOTE-DEV-001',
        resinaId: resina.id,
        fornecedorId: fornecedor.id,
        quantidadeInicialKg: '1000.000',
        saldoAtualKg: '1000.000',
        dataRecebimento: new Date().toISOString().slice(0, 10),
        origem: 'COMPRA',
        status: 'DISPONIVEL',
        ativo: true,
      }),
    );
  }
  const movimentoExistente = await manager.getRepository(MovimentoEstoqueLote).findOne({
    where: { loteResinaId: lote.id, tipo: 'ENTRADA' },
  });
  if (!movimentoExistente) {
    await manager.getRepository(MovimentoEstoqueLote).save(
      manager.getRepository(MovimentoEstoqueLote).create({
        empresaId,
        loteResinaId: lote.id,
        tipo: 'ENTRADA',
        quantidadeKg: '1000.000',
        observacao: 'Entrada inicial desenvolvimento',
      }),
    );
  }
  await manager.getRepository(OrdemProducao).save(
    await upsertAndReturn(
      manager,
      OrdemProducao,
      { empresaId, numero: 'OP-DEV-001' },
      {
        empresaId,
        unidadeId,
        numero: 'OP-DEV-001',
        itemId: item.id,
        moldeId: molde.id,
        quantidadePlanejada: 1000,
        dataInicioPlanejada: new Date().toISOString().slice(0, 10),
        status: 'ABERTA',
        ativo: true,
      },
    ),
  );
  if (podeImprimirPin && !process.env.SEED_OPERATOR_PIN) {
    // eslint-disable-next-line no-console
    console.log('PIN temporario do operador OP001: 2468');
  }
}

async function upsertAndReturn<T extends object>(
  manager: EntityManager,
  entity: new () => T,
  where: Partial<T>,
  values: Partial<T>,
): Promise<T> {
  const repo = manager.getRepository(entity);
  const current = await repo.findOne({ where: where as never });
  return repo.create({ ...(current ?? {}), ...values } as never) as T;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Falha ao executar seed do admin:', error);
  process.exitCode = 1;
});
