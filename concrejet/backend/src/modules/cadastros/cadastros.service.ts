import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, DeepPartial, ILike, QueryFailedError, Repository } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  ConfiguracaoItemMolde,
  Fornecedor,
  LoteResina,
  MovimentoEstoqueLote,
  OrdemProducao,
  Resina,
} from './entities';
import { CadastroPermissionsService } from './permissions.service';
import { CadastroAction, CADASTRO_RESOURCES, CadastroResource } from './cadastros.registry';

type Body = Record<string, unknown>;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESIN_LOT_ORIGINS = ['COMPRA', 'INTERNA', 'AJUSTE'] as const;
const RESIN_LOT_STATUSES = ['DISPONIVEL', 'BLOQUEADO', 'ESGOTADO', 'INATIVO'] as const;
interface CadastroEntity extends Record<string, unknown> {
  id: string;
}

@Injectable()
export class CadastrosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly permissions: CadastroPermissionsService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async list(slug: string, user: AuthenticatedUser, query: Body) {
    const resource = await this.authorize(slug, user, 'consultar');
    const repo = this.repo(resource);
    const where: Body = { empresaId: user.empresaId };
    if (query.ativo === 'true') where.ativo = true;
    if (query.ativo === 'false') where.ativo = false;

    const q = typeof query.q === 'string' ? query.q.trim() : '';
    const searchWhere = q
      ? resource.searchable.map((field) => ({ ...where, [field]: ILike(`%${q}%`) }))
      : where;

    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const [data, total] = await repo.findAndCount({
      where: searchWhere as never,
      order: { criadoEm: 'DESC' } as never,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { page, limit, total } };
  }

  async get(slug: string, id: string, user: AuthenticatedUser) {
    const resource = await this.authorize(slug, user, 'consultar');
    const entity = await this.findOwned(resource, id, user.empresaId);
    return entity;
  }

  async create(slug: string, body: Body, user: AuthenticatedUser, correlationId?: string) {
    const resource = await this.authorize(slug, user, 'criar');
    this.validateBody(resource, body, true);

    if (slug === 'resin-lots') return this.createResinLot(resource, body, user, correlationId);
    if (slug === 'item-mold-configurations') {
      return this.createItemMoldConfiguration(resource, body, user, correlationId);
    }

    const repo = this.repo(resource);
    const entity = repo.create({
      ...this.pick(resource, body),
      empresaId: user.empresaId,
      criadoPorUsuarioId: user.sub,
      atualizadoPorUsuarioId: user.sub,
    });
    const saved = await repo.save(entity);
    await this.audit(resource, String(saved.id), 'CREATE', user, null, saved, correlationId);
    return saved;
  }

  async update(
    slug: string,
    id: string,
    body: Body,
    user: AuthenticatedUser,
    correlationId?: string,
  ) {
    const resource = await this.authorize(slug, user, 'editar');
    if (resource.readOnly)
      throw new BadRequestException('Cadastro historico nao permite edicao destrutiva.');
    if (slug === 'resin-lots' && 'saldoAtualKg' in body) {
      throw new BadRequestException('Saldo de lote nao pode ser editado diretamente.');
    }
    this.validateBody(resource, body, false);
    if (slug === 'resin-lots') await this.validateResinLotUpdate(body, user.empresaId);
    const repo = this.repo(resource);
    const current = await this.findOwned(resource, id, user.empresaId);
    const before = { ...current };
    repo.merge(current, { ...this.pick(resource, body), atualizadoPorUsuarioId: user.sub });
    const saved = await repo.save(current);
    await this.audit(resource, id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async setActive(
    slug: string,
    id: string,
    active: boolean,
    user: AuthenticatedUser,
    correlationId?: string,
  ) {
    const action: CadastroAction = active ? 'reativar' : 'inativar';
    const resource = await this.authorize(slug, user, action);
    const repo = this.repo(resource);
    const current = await this.findOwned(resource, id, user.empresaId);
    const before = { ...current };
    repo.merge(current, { ativo: active, atualizadoPorUsuarioId: user.sub });
    const saved = await repo.save(current);
    await this.audit(resource, id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async cancelProductionOrder(
    id: string,
    body: Body,
    user: AuthenticatedUser,
    correlationId?: string,
  ) {
    const resource = await this.authorize('production-orders', user, 'editar');
    const justificativa = typeof body.justificativa === 'string' ? body.justificativa.trim() : '';
    if (!justificativa)
      throw new BadRequestException('Justificativa de cancelamento e obrigatoria.');
    const repo = this.dataSource.getRepository(OrdemProducao);
    const current = await repo.findOne({ where: { id, empresaId: user.empresaId } });
    if (!current) throw new NotFoundException('Registro nao encontrado.');
    if (current.status !== 'ABERTA')
      throw new BadRequestException('Somente OP aberta pode ser cancelada.');
    const before = { ...current };
    current.status = 'CANCELADA';
    current.ativo = false;
    current.justificativaCancelamento = justificativa;
    current.atualizadoPorUsuarioId = user.sub;
    const saved = await repo.save(current);
    await this.audit(resource, id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  private async createResinLot(
    resource: CadastroResource,
    body: Body,
    user: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.validateResinLotPayload(body, true);

    return this.dataSource.transaction(async (manager) => {
      const lotRepo = manager.getRepository(LoteResina);
      const resinRepo = manager.getRepository(Resina);
      const supplierRepo = manager.getRepository(Fornecedor);
      const movementRepo = manager.getRepository(MovimentoEstoqueLote);

      const existing = await lotRepo.findOne({
        where: { empresaId: user.empresaId, codigo: String(body.codigo).trim() },
      });
      if (existing) throw new ConflictException('Ja existe lote de resina com este codigo.');

      const resina = await resinRepo.findOne({
        where: { id: String(body.resinaId), empresaId: user.empresaId, ativo: true },
      });
      if (!resina) throw new BadRequestException('Resina informada nao existe ou esta inativa.');

      const fornecedorId = body.fornecedorId ? String(body.fornecedorId) : null;
      if (fornecedorId) {
        const fornecedor = await supplierRepo.findOne({
          where: { id: fornecedorId, empresaId: user.empresaId, ativo: true },
        });
        if (!fornecedor) {
          throw new BadRequestException('Fornecedor informado nao existe ou esta inativo.');
        }
      }

      await manager.query(`select set_config('app.allow_lote_saldo_update', 'on', true)`);
      const payload = this.pick(resource, body);
      delete payload.saldoAtualKg;
      const quantidadeInicialKg = String(body.quantidadeInicialKg);
      const origem = String(body.origem).toUpperCase() as LoteResina['origem'];
      const status = String(body.status).toUpperCase() as LoteResina['status'];
      const lotPayload: DeepPartial<LoteResina> = {
        ...payload,
        codigo: String(body.codigo).trim(),
        fornecedorId,
        origem,
        status,
        empresaId: user.empresaId,
        saldoAtualKg: quantidadeInicialKg,
        criadoPorUsuarioId: user.sub,
        atualizadoPorUsuarioId: user.sub,
      };
      const lot = lotRepo.create(lotPayload);

      try {
        const saved = await lotRepo.save(lot);
        await movementRepo.save(
          movementRepo.create({
            empresaId: user.empresaId,
            loteResinaId: saved.id,
            tipo: 'ENTRADA',
            quantidadeKg: String(saved.quantidadeInicialKg),
            observacao: 'Entrada inicial do lote',
            criadoPorUsuarioId: user.sub,
            atualizadoPorUsuarioId: user.sub,
          }),
        );
        await this.audit(resource, saved.id, 'CREATE', user, null, saved, correlationId);
        return saved;
      } catch (error) {
        this.handleResinLotPersistenceError(error);
      }
    });
  }

  private async createItemMoldConfiguration(
    resource: CadastroResource,
    body: Body,
    user: AuthenticatedUser,
    correlationId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ConfiguracaoItemMolde);
      const current = await repo.findOne({
        where: {
          empresaId: user.empresaId,
          itemId: String(body.itemId),
          moldeId: String(body.moldeId),
          ativo: true,
        },
        order: { versaoConfiguracao: 'DESC' },
      });
      if (current && !String(body.motivoAlteracao ?? '').trim()) {
        throw new BadRequestException('Motivo da alteracao e obrigatorio para nova versao.');
      }
      const startsAt = body.vigenciaInicio ? new Date(String(body.vigenciaInicio)) : new Date();
      if (current) {
        current.ativo = false;
        current.vigenciaFim = startsAt;
        current.atualizadoPorUsuarioId = user.sub;
        await repo.save(current);
      }
      const next = repo.create({
        ...this.pick(resource, body),
        empresaId: user.empresaId,
        vigenciaInicio: startsAt,
        vigenciaFim: null,
        versaoConfiguracao: current ? current.versaoConfiguracao + 1 : 1,
        ativo: true,
        criadoPorUsuarioId: user.sub,
        atualizadoPorUsuarioId: user.sub,
      });
      const saved = await repo.save(next);
      await this.audit(resource, saved.id, 'CREATE', user, current, saved, correlationId);
      return saved;
    });
  }

  private async validateResinLotUpdate(body: Body, empresaId: string): Promise<void> {
    this.validateResinLotPayload(body, false);
    if (body.resinaId !== undefined) {
      const resina = await this.dataSource.getRepository(Resina).findOne({
        where: { id: String(body.resinaId), empresaId, ativo: true },
      });
      if (!resina) throw new BadRequestException('Resina informada nao existe ou esta inativa.');
    }
    if (body.fornecedorId !== undefined && body.fornecedorId !== '') {
      const fornecedor = await this.dataSource.getRepository(Fornecedor).findOne({
        where: { id: String(body.fornecedorId), empresaId, ativo: true },
      });
      if (!fornecedor) {
        throw new BadRequestException('Fornecedor informado nao existe ou esta inativo.');
      }
    }
  }

  private validateResinLotPayload(body: Body, isCreate: boolean): void {
    if ('saldoAtualKg' in body) {
      throw new BadRequestException('Saldo atual e calculado pelo sistema e nao pode ser enviado.');
    }

    if (body.resinaId !== undefined && !this.isUuid(body.resinaId)) {
      throw new BadRequestException('Resina deve ser selecionada na lista de resinas cadastradas.');
    }

    if (body.fornecedorId === '') body.fornecedorId = null;

    if (
      body.fornecedorId !== undefined &&
      body.fornecedorId !== null &&
      !this.isUuid(body.fornecedorId)
    ) {
      throw new BadRequestException(
        'Fornecedor deve ser selecionado na lista de fornecedores cadastrados.',
      );
    }

    const origem = String(body.origem ?? (isCreate ? '' : 'COMPRA')).toUpperCase();
    if (body.origem !== undefined) body.origem = origem;
    if ((isCreate || body.origem !== undefined) && !RESIN_LOT_ORIGINS.includes(origem as never)) {
      throw new BadRequestException('Origem do lote e invalida.');
    }

    if (
      (isCreate || body.fornecedorId !== undefined || body.origem !== undefined) &&
      origem === 'COMPRA' &&
      !body.fornecedorId
    ) {
      throw new BadRequestException('Fornecedor e obrigatorio para lotes de origem COMPRA.');
    }

    const status = String(body.status ?? (isCreate ? '' : 'DISPONIVEL')).toUpperCase();
    if (body.status !== undefined) body.status = status;
    if ((isCreate || body.status !== undefined) && !RESIN_LOT_STATUSES.includes(status as never)) {
      throw new BadRequestException('Status do lote e invalido.');
    }

    if (body.quantidadeInicialKg !== undefined) {
      const quantidade = Number(body.quantidadeInicialKg);
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        throw new BadRequestException('Quantidade inicial em kg deve ser maior que zero.');
      }
    }

    if (body.custoPorKg !== undefined && body.custoPorKg !== '') {
      const custo = Number(body.custoPorKg);
      if (!Number.isFinite(custo) || custo < 0) {
        throw new BadRequestException('Custo por kg nao pode ser negativo.');
      }
    }
  }

  private isUuid(value: unknown): boolean {
    return typeof value === 'string' && UUID_REGEX.test(value);
  }

  private handleResinLotPersistenceError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error as QueryFailedError & { code?: string }).code;
      if (code === '23505')
        throw new ConflictException('Ja existe lote de resina com este codigo.');
      if (code === '23503')
        throw new BadRequestException('Resina ou fornecedor informado nao existe.');
      if (code === '23514')
        throw new BadRequestException('Dados do lote violam uma regra de validacao.');
      if (code === '22P02')
        throw new BadRequestException('Resina ou fornecedor deve ser um UUID valido.');
    }
    throw error;
  }
  private async authorize(slug: string, user: AuthenticatedUser, action: CadastroAction) {
    const resource = CADASTRO_RESOURCES[slug];
    if (!resource) throw new NotFoundException('Recurso de cadastro nao encontrado.');
    await this.permissions.assertCan(user.sub, `${resource.permission}.${action}`);
    return resource;
  }

  private validateBody(resource: CadastroResource, body: Body, isCreate: boolean): void {
    const unknown = Object.keys(body).filter((key) => !resource.writable.includes(key));
    if (unknown.length)
      throw new BadRequestException(`Campos nao permitidos: ${unknown.join(', ')}`);
    if (isCreate) {
      const missing = resource.required.filter(
        (key) => body[key] === undefined || body[key] === '',
      );
      if (missing.length)
        throw new BadRequestException(`Campos obrigatorios: ${missing.join(', ')}`);
    }
  }

  private pick(resource: CadastroResource, body: Body): Body {
    return resource.writable.reduce<Body>((acc, key) => {
      if (body[key] !== undefined) acc[key] = body[key];
      return acc;
    }, {});
  }

  private repo(resource: CadastroResource): Repository<CadastroEntity> {
    return this.dataSource.getRepository(resource.entity) as Repository<CadastroEntity>;
  }

  private async findOwned(
    resource: CadastroResource,
    id: string,
    empresaId: string,
  ): Promise<CadastroEntity> {
    const entity = await this.repo(resource).findOne({ where: { id, empresaId } as never });
    if (!entity) throw new NotFoundException('Registro nao encontrado.');
    return entity;
  }

  private async audit(
    resource: CadastroResource,
    id: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    user: AuthenticatedUser,
    before: unknown,
    after: unknown,
    correlationId?: string,
  ) {
    await this.auditoria.registrar({
      entidade: resource.slug,
      entidadeId: id,
      acao: action,
      usuarioId: user.sub,
      dadosAntes: before as Record<string, unknown> | null,
      dadosDepois: after as Record<string, unknown> | null,
      correlationId,
    });
  }
}
