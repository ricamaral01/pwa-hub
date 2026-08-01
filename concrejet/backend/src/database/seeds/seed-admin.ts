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
  Funcao,
  Item,
  Molde,
  Operacao,
  TipoOcorrencia,
  Fornecedor,
  Resina,
} from '../../modules/cadastros/entities';

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
          permissoes: [permissao, ...fase1Permissoes],
        }),
      );
    } else {
      const chavesAtuais = new Set((perfil.permissoes ?? []).map((item) => item.chave));
      const novasPermissoes = [permissao, ...fase1Permissoes].filter(
        (item) => !chavesAtuais.has(item.chave),
      );
      if (novasPermissoes.length) {
        perfil.permissoes = [...(perfil.permissoes ?? []), ...novasPermissoes];
        await perfilRepo.save(perfil);
      }
    }

    await seedFase1Basico(manager, empresa.id);

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

async function seedFase1Basico(manager: EntityManager, empresaId: string) {
  await manager
    .getRepository(Funcao)
    .upsert({ empresaId, codigo: 'OP-INJ', descricao: 'Operador de injecao', ativo: true }, [
      'empresaId',
      'codigo',
    ]);
  await manager
    .getRepository(Operacao)
    .upsert({ empresaId, codigo: 'INJ', descricao: 'Injecao plastica', ativo: true }, [
      'empresaId',
      'codigo',
    ]);
  await manager
    .getRepository(TipoOcorrencia)
    .upsert({ empresaId, codigo: 'PARADA', descricao: 'Parada de maquina', ativo: true }, [
      'empresaId',
      'codigo',
    ]);
  await manager
    .getRepository(Fornecedor)
    .upsert({ empresaId, nome: 'Fornecedor Padrao', documento: '00000000000000', ativo: true }, [
      'empresaId',
      'documento',
    ]);
  await manager.getRepository(Resina).upsert(
    {
      empresaId,
      codigo: 'PP-HOMO',
      descricao: 'Polipropileno homopolimero',
      fabricante: 'Padrao',
      ativo: true,
    },
    ['empresaId', 'codigo'],
  );
  await manager
    .getRepository(Item)
    .upsert({ empresaId, codigo: 'ITEM-001', descricao: 'Item de desenvolvimento', ativo: true }, [
      'empresaId',
      'codigo',
    ]);
  await manager
    .getRepository(Molde)
    .upsert(
      { empresaId, codigo: 'MOLDE-001', descricao: 'Molde de desenvolvimento', ativo: true },
      ['empresaId', 'codigo'],
    );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Falha ao executar seed do admin:', error);
  process.exitCode = 1;
});
