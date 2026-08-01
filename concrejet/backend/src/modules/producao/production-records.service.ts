import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, MoreThan, Not } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  Colaborador,
  ConfiguracaoItemMolde,
  LoteResina,
  OrdemProducao,
} from '../cadastros/entities';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';
import { Apontamento } from './entities/apontamento.entity';
import {
  CancelProductionRecordDto,
  CreateProductionRecordDto,
  FinishProductionRecordDto,
  UpdateProductionRecordDto,
} from './dto';

@Injectable()
export class ProductionRecordsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateProductionRecordDto, user: AuthenticatedUser, correlationId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const existingByKey = await manager
        .getRepository(Apontamento)
        .findOne({ where: { idempotencyKey: dto.idempotencyKey, empresaId: user.empresaId } });
      if (existingByKey) return existingByKey;

      const dispositivo = await manager.getRepository(Dispositivo).findOne({
        where: { id: dto.dispositivoId, ativo: true },
        relations: ['maquina'],
      });
      if (!dispositivo) throw new BadRequestException('Dispositivo invalido ou inativo.');
      if (!dispositivo.maquinaId) throw new BadRequestException('Dispositivo sem maquina vinculada.');

      const operador = await manager.getRepository(Colaborador).findOne({
        where: { id: dto.operadorId, empresaId: user.empresaId, ativo: true },
      });
      if (!operador) throw new BadRequestException('Operador invalido ou inativo.');

      const configuracao = await manager.getRepository(ConfiguracaoItemMolde).findOne({
        where: {
          id: dto.configuracaoItemMoldeId,
          empresaId: user.empresaId,
          itemId: dto.itemId,
          ativo: true,
        },
      });
      if (!configuracao) throw new BadRequestException('Configuracao item-molde vigente nao encontrada.');

      const lote = await manager.getRepository(LoteResina).findOne({
        where: { id: dto.loteResinaId, empresaId: user.empresaId, ativo: true },
      });
      if (!lote) throw new BadRequestException('Lote de resina inexistente.');
      if (lote.status !== 'DISPONIVEL') throw new ConflictException('Lote de resina indisponivel.');

      if (dto.ordemProducaoId) {
        const ordem = await manager.getRepository(OrdemProducao).findOne({
          where: { id: dto.ordemProducaoId, empresaId: user.empresaId, itemId: dto.itemId },
        });
        if (!ordem) throw new BadRequestException('Ordem de producao nao corresponde ao item.');
      }

      const open = await manager.getRepository(Apontamento).findOne({
        where: { maquinaId: dispositivo.maquinaId, status: 'em_andamento' },
      });
      if (open) throw new ConflictException('Ja existe apontamento em andamento nesta maquina.');

      const inicioEm = dto.inicioEm ? new Date(dto.inicioEm) : new Date();
      const record = manager.getRepository(Apontamento).create({
        empresaId: user.empresaId,
        unidadeId: dispositivo.maquina!.unidadeId,
        dispositivoId: dispositivo.id,
        maquinaId: dispositivo.maquinaId,
        operadorId: operador.id,
        ordemProducaoId: dto.ordemProducaoId ?? null,
        itemId: dto.itemId,
        moldeId: configuracao.moldeId,
        configuracaoItemMoldeId: configuracao.id,
        loteResinaId: lote.id,
        operacaoId: dto.operacaoId,
        dataProducao: inicioEm.toISOString().slice(0, 10),
        inicioEm,
        status: 'em_andamento',
        origem: 'tablet',
        idempotencyKey: dto.idempotencyKey,
        pesoPecaAplicadoG: String(configuracao.pesoPecaG),
        cavidadesAplicadas: configuracao.cavidades,
        cicloPadraoAplicadoS: String(configuracao.cicloPadraoSegundos),
        cicloCustoAplicadoS: configuracao.cicloCustoSegundos ?? null,
        limitePerdaAplicadoPct: configuracao.limitePerdaPercentual ?? '100',
        custoResinaAplicadoKg: lote.custoPorKg ?? null,
        createdBy: user.sub,
        updatedBy: user.sub,
      });
      const saved = await manager.getRepository(Apontamento).save(record);
      await this.audit(saved.id, 'CREATE', user, null, saved, correlationId);
      return saved;
    });
  }

  async list(user: AuthenticatedUser, query: Record<string, unknown>) {
    const repo = this.dataSource.getRepository(Apontamento);
    const where: Record<string, unknown> = { empresaId: user.empresaId };
    if (typeof query.status === 'string' && query.status) where.status = query.status;
    if (typeof query.maquinaId === 'string' && query.maquinaId) where.maquinaId = query.maquinaId;
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const [data, total] = await repo.findAndCount({
      where,
      order: { inicioEm: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  async get(id: string, user: AuthenticatedUser) {
    const record = await this.findOwned(id, user.empresaId);
    return record;
  }

  async update(id: string, dto: UpdateProductionRecordDto, user: AuthenticatedUser, correlationId?: string) {
    const repo = this.dataSource.getRepository(Apontamento);
    const record = await this.findOwned(id, user.empresaId);
    this.assertVersion(record, dto.version);
    if (record.status !== 'em_andamento') throw new ConflictException('Somente apontamento em andamento pode ser alterado.');
    const before = { ...record };
    repo.merge(record, this.quantities(dto, user.sub));
    const saved = await repo.save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async finish(id: string, dto: FinishProductionRecordDto, user: AuthenticatedUser, correlationId?: string) {
    const repo = this.dataSource.getRepository(Apontamento);
    const record = await this.findOwned(id, user.empresaId);
    this.assertVersion(record, dto.version);
    if (record.status !== 'em_andamento') throw new ConflictException('Somente apontamento em andamento pode ser concluido.');
    const fimEm = new Date(dto.fimEm);
    if (fimEm <= record.inicioEm) throw new BadRequestException('Fim deve ser maior que inicio.');
    const before = { ...record };
    repo.merge(record, { ...this.quantities(dto, user.sub), fimEm, status: 'concluido' });
    const saved = await repo.save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async cancel(id: string, dto: CancelProductionRecordDto, user: AuthenticatedUser, correlationId?: string) {
    const repo = this.dataSource.getRepository(Apontamento);
    const record = await this.findOwned(id, user.empresaId);
    this.assertVersion(record, dto.version);
    if (!dto.motivoCancelamento.trim()) throw new BadRequestException('Cancelamento exige justificativa.');
    if (record.status !== 'em_andamento') throw new ConflictException('Somente apontamento em andamento pode ser cancelado.');
    const before = { ...record };
    repo.merge(record, {
      status: 'cancelado',
      motivoCancelamento: dto.motivoCancelamento.trim(),
      canceladoPor: user.sub,
      canceladoEm: new Date(),
      updatedBy: user.sub,
    });
    const saved = await repo.save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async currentByDevice(dispositivoId: string, user: AuthenticatedUser) {
    return this.dataSource.getRepository(Apontamento).findOne({
      where: {
        empresaId: user.empresaId,
        dispositivoId,
        status: Not('cancelado'),
        fimEm: undefined,
        inicioEm: MoreThan(new Date(0)),
      },
      order: { inicioEm: 'DESC' },
    });
  }

  private quantities(dto: UpdateProductionRecordDto, userId: string): Partial<Apontamento> {
    return {
      pecasBoas: dto.pecasBoas,
      pecasRefugo: dto.pecasRefugo,
      falhaPreenchimentoQtd: dto.falhaPreenchimentoQtd,
      borraKg: dto.borraKg === undefined ? undefined : String(dto.borraKg),
      galhoKg: dto.galhoKg === undefined ? undefined : String(dto.galhoKg),
      outrasPerdasKg: dto.outrasPerdasKg === undefined ? undefined : String(dto.outrasPerdasKg),
      observacao: dto.observacao,
      updatedBy: userId,
    };
  }

  private async findOwned(id: string, empresaId: string): Promise<Apontamento> {
    const record = await this.dataSource.getRepository(Apontamento).findOne({ where: { id, empresaId } });
    if (!record) throw new NotFoundException('Apontamento nao encontrado.');
    return record;
  }

  private assertVersion(record: Apontamento, version: number): void {
    if (record.versao !== version) throw new ConflictException('Registro alterado por outra sessao.');
  }

  private async audit(
    id: string,
    action: 'CREATE' | 'UPDATE',
    user: AuthenticatedUser,
    before: unknown,
    after: unknown,
    correlationId?: string,
  ) {
    await this.auditoria.registrar({
      entidade: 'apontamento',
      entidadeId: id,
      acao: action,
      usuarioId: user.sub,
      dadosAntes: before as Record<string, unknown> | null,
      dadosDepois: after as Record<string, unknown> | null,
      correlationId,
    });
  }
}
