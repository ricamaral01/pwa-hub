import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TipoOcorrencia } from '../cadastros/entities';
import type { OperationalUser } from '../auth/operator-session.guard';
import { Apontamento } from '../producao/entities/apontamento.entity';
import { Ocorrencia } from './entities/ocorrencia.entity';
import {
  ApproveOccurrenceDto,
  CancelOccurrenceDto,
  CreateOccurrenceDto,
  FinishOccurrenceDto,
  UpdateOccurrenceDto,
} from './dto';

const OPEN_STATUSES = ['aberta', 'aguardando_acao', 'aguardando_aprovacao'] as const;

@Injectable()
export class OccurrencesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateOccurrenceDto, user: OperationalUser, correlationId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.getRepository(Ocorrencia).findOne({
        where: { empresaId: user.empresaId, idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;

      const apontamento = await manager.getRepository(Apontamento).findOne({
        where: { id: dto.apontamentoId, empresaId: user.empresaId },
      });
      if (!apontamento) throw new BadRequestException('Apontamento inexistente.');
      this.assertApontamentoOperacional(apontamento, user);
      if (apontamento.status !== 'em_andamento') {
        throw new ConflictException('Apontamento deve estar em andamento para abrir ocorrencia.');
      }

      const tipo = await manager.getRepository(TipoOcorrencia).findOne({
        where: { id: dto.tipoOcorrenciaId, empresaId: user.empresaId, ativo: true },
      });
      if (!tipo) throw new BadRequestException('Tipo de ocorrencia inexistente ou inativo.');

      const inicioEm = dto.inicioEm ? new Date(dto.inicioEm) : new Date();
      this.assertInsideApontamentoWindow(apontamento, inicioEm);

      const open = await manager.getRepository(Ocorrencia).findOne({
        where: { maquinaId: user.maquinaId, status: In([...OPEN_STATUSES]) },
      });
      if (open) throw new ConflictException('Ja existe ocorrencia aberta nesta maquina.');

      const status = tipo.exigeAcaoCorretiva ? 'aguardando_acao' : 'aberta';
      const record = manager.getRepository(Ocorrencia).create({
        empresaId: user.empresaId,
        unidadeId: user.unidadeId,
        apontamentoId: apontamento.id,
        maquinaId: user.maquinaId,
        dispositivoId: user.dispositivoId,
        operadorId: user.operadorId,
        tipoOcorrenciaId: tipo.id,
        classificacao: dto.classificacao,
        programacao: dto.programacao,
        entraCalculoOee: dto.entraCalculoOee ?? tipo.entraCalculoOee,
        inicioEm,
        descricao: dto.descricao.trim(),
        causa: dto.causa?.trim() || null,
        acaoCorretiva: dto.acaoCorretiva?.trim() || null,
        exigeAcaoCorretivaAplicado: tipo.exigeAcaoCorretiva,
        exigeAprovacaoAplicado: tipo.exigeAprovacao,
        status,
        idempotencyKey: dto.idempotencyKey,
        createdBy: null,
        updatedBy: null,
      });
      const saved = await manager.getRepository(Ocorrencia).save(record);
      await this.audit(saved.id, 'CREATE', user, null, saved, correlationId);
      return saved;
    });
  }

  async list(user: OperationalUser, query: Record<string, unknown>) {
    const where: Record<string, unknown> = { empresaId: user.empresaId };
    for (const field of [
      'maquinaId',
      'dispositivoId',
      'operadorId',
      'apontamentoId',
      'tipoOcorrenciaId',
      'status',
      'classificacao',
      'programacao',
    ]) {
      if (typeof query[field] === 'string' && query[field]) where[field] = query[field];
    }
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const [data, total] = await this.dataSource.getRepository(Ocorrencia).findAndCount({
      where,
      order: { inicioEm: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  currentByDevice(user: OperationalUser) {
    return this.dataSource.getRepository(Ocorrencia).findOne({
      where: {
        empresaId: user.empresaId,
        dispositivoId: user.dispositivoId,
        status: In([...OPEN_STATUSES]),
      },
      order: { inicioEm: 'DESC' },
    });
  }

  async get(id: string, user: OperationalUser) {
    return this.findOwned(id, user);
  }

  async update(
    id: string,
    dto: UpdateOccurrenceDto,
    user: OperationalUser,
    correlationId?: string,
  ) {
    const record = await this.findOwned(id, user);
    this.assertVersion(record, dto.version);
    if (!OPEN_STATUSES.includes(record.status as never)) {
      throw new ConflictException('Somente ocorrencia aberta pode ser alterada.');
    }
    const before = { ...record };
    Object.assign(record, {
      descricao: dto.descricao?.trim() ?? record.descricao,
      causa: dto.causa?.trim() ?? record.causa,
      acaoCorretiva: dto.acaoCorretiva?.trim() ?? record.acaoCorretiva,
      status:
        record.exigeAcaoCorretivaAplicado && !dto.acaoCorretiva?.trim()
          ? 'aguardando_acao'
          : record.exigeAprovacaoAplicado
            ? 'aguardando_aprovacao'
            : 'aberta',
      updatedBy: null,
    });
    const saved = await this.dataSource.getRepository(Ocorrencia).save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async approve(
    id: string,
    dto: ApproveOccurrenceDto,
    user: OperationalUser,
    correlationId?: string,
  ) {
    const record = await this.findOwned(id, user);
    this.assertVersion(record, dto.version);
    if (!record.exigeAprovacaoAplicado)
      throw new BadRequestException('Ocorrencia nao exige aprovacao.');
    if (record.exigeAcaoCorretivaAplicado && !record.acaoCorretiva?.trim()) {
      throw new ConflictException('Acao corretiva obrigatoria pendente.');
    }
    const before = { ...record };
    record.aprovadaPor = null;
    record.aprovadaEm = new Date();
    record.status = 'aberta';
    record.updatedBy = null;
    const saved = await this.dataSource.getRepository(Ocorrencia).save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async finish(
    id: string,
    dto: FinishOccurrenceDto,
    user: OperationalUser,
    correlationId?: string,
  ) {
    const existing = await this.dataSource.getRepository(Ocorrencia).findOne({
      where: { idempotencyKey: dto.idempotencyKey, empresaId: user.empresaId, status: 'encerrada' },
    });
    if (existing) return existing;
    const record = await this.findOwned(id, user);
    this.assertVersion(record, dto.version);
    if (
      record.exigeAcaoCorretivaAplicado &&
      !(dto.acaoCorretiva?.trim() || record.acaoCorretiva?.trim())
    ) {
      throw new ConflictException('Acao corretiva obrigatoria pendente.');
    }
    if (record.exigeAprovacaoAplicado && !record.aprovadaEm) {
      throw new ConflictException('Aprovacao obrigatoria pendente.');
    }
    const fimEm = dto.fimEm ? new Date(dto.fimEm) : new Date();
    if (fimEm <= record.inicioEm)
      throw new BadRequestException('Fim deve ser posterior ao inicio.');
    const apontamento = await this.dataSource
      .getRepository(Apontamento)
      .findOne({ where: { id: record.apontamentoId } });
    if (apontamento?.fimEm && fimEm > apontamento.fimEm) {
      throw new BadRequestException('Ocorrencia deve ficar dentro da janela do apontamento.');
    }
    const before = { ...record };
    Object.assign(record, {
      causa: dto.causa?.trim() ?? record.causa,
      acaoCorretiva: dto.acaoCorretiva?.trim() ?? record.acaoCorretiva,
      fimEm,
      encerradaPor: null,
      encerradaEm: new Date(),
      status: 'encerrada',
      updatedBy: null,
    });
    const saved = await this.dataSource.getRepository(Ocorrencia).save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async cancel(
    id: string,
    dto: CancelOccurrenceDto,
    user: OperationalUser,
    correlationId?: string,
  ) {
    const record = await this.findOwned(id, user);
    this.assertVersion(record, dto.version);
    if (!dto.motivoCancelamento.trim())
      throw new BadRequestException('Cancelamento exige justificativa.');
    const before = { ...record };
    Object.assign(record, {
      status: 'cancelada',
      motivoCancelamento: dto.motivoCancelamento.trim(),
      canceladaPor: null,
      canceladaEm: new Date(),
      updatedBy: null,
    });
    const saved = await this.dataSource.getRepository(Ocorrencia).save(record);
    await this.audit(id, 'UPDATE', user, before, saved, correlationId);
    return saved;
  }

  async assertNoOpenOccurrence(apontamentoId: string, empresaId: string) {
    const open = await this.dataSource.getRepository(Ocorrencia).findOne({
      where: { apontamentoId, empresaId, status: In([...OPEN_STATUSES]) },
    });
    if (open)
      throw new ConflictException('Nao e possivel concluir apontamento com ocorrencia aberta.');
  }

  private async findOwned(id: string, user: OperationalUser) {
    const record = await this.dataSource.getRepository(Ocorrencia).findOne({
      where: { id, empresaId: user.empresaId, status: Not('cancelada') },
    });
    if (!record) throw new NotFoundException('Ocorrencia nao encontrada.');
    return record;
  }

  private assertVersion(record: Ocorrencia, version: number) {
    if (record.versao !== version)
      throw new ConflictException('Registro alterado por outra sessao.');
  }

  private assertApontamentoOperacional(apontamento: Apontamento, user: OperationalUser) {
    if (apontamento.maquinaId !== user.maquinaId)
      throw new BadRequestException('Maquina divergente do apontamento.');
    if (apontamento.dispositivoId !== user.dispositivoId)
      throw new BadRequestException('Dispositivo divergente do apontamento.');
    if (apontamento.unidadeId !== user.unidadeId)
      throw new BadRequestException('Unidade divergente do apontamento.');
  }

  private assertInsideApontamentoWindow(apontamento: Apontamento, inicioEm: Date) {
    if (inicioEm < apontamento.inicioEm)
      throw new BadRequestException('Inicio fora da janela do apontamento.');
    if (apontamento.fimEm && inicioEm > apontamento.fimEm) {
      throw new BadRequestException('Inicio fora da janela do apontamento.');
    }
  }

  private audit(
    id: string,
    action: 'CREATE' | 'UPDATE',
    user: OperationalUser,
    before: unknown,
    after: unknown,
    correlationId?: string,
  ) {
    return this.auditoria.registrar({
      entidade: 'ocorrencia',
      entidadeId: id,
      acao: action,
      usuarioId: null,
      dadosAntes: before as Record<string, unknown> | null,
      dadosDepois: after as Record<string, unknown> | null,
      correlationId,
    });
  }
}
