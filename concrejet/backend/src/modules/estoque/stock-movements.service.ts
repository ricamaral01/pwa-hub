import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LoteResina } from '../cadastros/entities';
import { Unidade } from '../organizacao/entities/unidade.entity';
import { Apontamento } from '../producao/entities/apontamento.entity';
import { EstoqueMovimento, StockMovementType } from './entities';
import {
  ReverseMovementDto,
  StockAdjustmentDto,
  StockEntryDto,
  StockReturnDto,
  TransferDto,
} from './dto';

const OUT_TYPES = new Set<StockMovementType>([
  'ajuste_negativo',
  'consumo',
  'transferencia_saida',
  'blenda_consumo',
  'estorno',
]);

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditoria: AuditoriaService,
  ) {}

  async entry(dto: StockEntryDto, user: { sub: string; empresaId: string }) {
    return this.dataSource.transaction((manager) =>
      this.applyMovement(manager, {
        empresaId: user.empresaId,
        loteId: dto.loteId,
        tipoMovimento: 'entrada',
        origemTipo: 'entrada_manual',
        quantidadeKg: dto.quantidadeKg,
        custoUnitarioAplicado: dto.custoUnitarioAplicado,
        observacao: dto.observacao,
        idempotencyKey: dto.idempotencyKey,
        criadoPor: user.sub,
      }),
    );
  }

  async adjustment(dto: StockAdjustmentDto, user: { sub: string; empresaId: string }) {
    if (!dto.motivo.trim()) throw new BadRequestException('Ajuste exige justificativa.');
    return this.dataSource.transaction((manager) =>
      this.applyMovement(manager, {
        empresaId: user.empresaId,
        loteId: dto.loteId,
        tipoMovimento: dto.tipo,
        origemTipo: 'ajuste_manual',
        quantidadeKg: dto.quantidadeKg,
        custoUnitarioAplicado: dto.custoUnitarioAplicado,
        observacao: dto.observacao,
        motivo: dto.motivo,
        idempotencyKey: dto.idempotencyKey,
        criadoPor: user.sub,
      }),
    );
  }

  async returnStock(dto: StockReturnDto, user: { sub: string; empresaId: string }) {
    if (!dto.motivo.trim()) throw new BadRequestException('Devolucao exige justificativa.');
    return this.dataSource.transaction((manager) =>
      this.applyMovement(manager, {
        empresaId: user.empresaId,
        loteId: dto.loteId,
        tipoMovimento: 'devolucao',
        origemTipo: 'devolucao_manual',
        quantidadeKg: dto.quantidadeKg,
        custoUnitarioAplicado: dto.custoUnitarioAplicado,
        observacao: dto.observacao,
        motivo: dto.motivo,
        idempotencyKey: dto.idempotencyKey,
        criadoPor: user.sub,
      }),
    );
  }

  async transfer(dto: TransferDto, user: { sub: string; empresaId: string }) {
    if (dto.loteOrigemId === dto.loteDestinoId)
      throw new BadRequestException('Lotes de origem e destino devem ser diferentes.');
    if (!dto.motivo.trim()) throw new BadRequestException('Transferencia exige justificativa.');
    return this.dataSource.transaction(async (manager) => {
      const saida = await this.applyMovement(manager, {
        empresaId: user.empresaId,
        loteId: dto.loteOrigemId,
        tipoMovimento: 'transferencia_saida',
        origemTipo: 'transferencia',
        quantidadeKg: dto.quantidadeKg,
        motivo: dto.motivo,
        idempotencyKey: dto.idempotencyKey,
        criadoPor: user.sub,
      });
      const entrada = await this.applyMovement(manager, {
        empresaId: user.empresaId,
        loteId: dto.loteDestinoId,
        tipoMovimento: 'transferencia_entrada',
        origemTipo: 'transferencia',
        origemId: saida.id,
        quantidadeKg: dto.quantidadeKg,
        motivo: dto.motivo,
        idempotencyKey: deriveKey(dto.idempotencyKey, 1),
        criadoPor: user.sub,
      });
      return { saida, entrada };
    });
  }

  async reverse(id: string, dto: ReverseMovementDto, user: { sub: string; empresaId: string }) {
    if (!dto.motivo.trim()) throw new BadRequestException('Estorno exige justificativa.');
    return this.dataSource.transaction(async (manager) => {
      const original = await manager.getRepository(EstoqueMovimento).findOne({
        where: { id, empresaId: user.empresaId },
      });
      if (!original) throw new NotFoundException('Movimento nao encontrado.');
      if (original.tipoMovimento === 'estorno')
        throw new ConflictException('Movimento de estorno nao pode ser estornado diretamente.');
      const already = await manager.getRepository(EstoqueMovimento).findOne({
        where: { movimentoEstornadoId: id, empresaId: user.empresaId },
      });
      if (already) return already;
      const reverseType: StockMovementType = OUT_TYPES.has(original.tipoMovimento)
        ? 'devolucao'
        : 'estorno';
      return this.applyMovement(manager, {
        empresaId: user.empresaId,
        loteId: original.loteId,
        tipoMovimento: reverseType,
        origemTipo: 'estorno',
        origemId: original.id,
        quantidadeKg: Number(original.quantidadeKg),
        motivo: dto.motivo,
        movimentoEstornadoId: original.id,
        idempotencyKey: dto.idempotencyKey,
        criadoPor: user.sub,
      });
    });
  }

  async consumeProductionRecord(
    manager: EntityManager,
    record: Apontamento,
  ): Promise<EstoqueMovimento> {
    const quantidadeKg = this.calculateRecordConsumptionKg(record);
    return this.applyMovement(manager, {
      empresaId: record.empresaId,
      unidadeId: record.unidadeId,
      loteId: record.loteResinaId,
      tipoMovimento: 'consumo',
      origemTipo: 'apontamento',
      origemId: record.id,
      quantidadeKg,
      custoUnitarioAplicado: record.custoResinaAplicadoKg
        ? Number(record.custoResinaAplicadoKg)
        : undefined,
      observacao: 'Consumo confirmado na conclusao do apontamento.',
      idempotencyKey: this.deterministicUuid(record.id, 'consumo'),
      criadoPor: null,
    });
  }

  async list(user: { empresaId: string }, query: Record<string, unknown>) {
    const repo = this.dataSource.getRepository(EstoqueMovimento);
    const where: Record<string, unknown> = { empresaId: user.empresaId };
    if (typeof query.loteId === 'string') where.loteId = query.loteId;
    if (typeof query.tipo === 'string') where.tipoMovimento = query.tipo;
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const [data, total] = await repo.findAndCount({
      where,
      order: { criadoEm: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  async get(id: string, user: { empresaId: string }) {
    const movement = await this.dataSource.getRepository(EstoqueMovimento).findOne({
      where: { id, empresaId: user.empresaId },
    });
    if (!movement) throw new NotFoundException('Movimento nao encontrado.');
    return movement;
  }

  async balance(loteId: string, user: { empresaId: string }) {
    const lote = await this.dataSource.getRepository(LoteResina).findOne({
      where: { id: loteId, empresaId: user.empresaId },
      relations: ['resina', 'fornecedor'],
    });
    if (!lote) throw new NotFoundException('Lote nao encontrado.');
    return {
      loteId: lote.id,
      codigo: lote.codigo,
      saldoAtualKg: Number(lote.saldoAtualKg),
      status: lote.status,
      resina: lote.resina
        ? { id: lote.resina.id, codigo: lote.resina.codigo, descricao: lote.resina.descricao }
        : null,
      fornecedor: lote.fornecedor ? { id: lote.fornecedor.id, nome: lote.fornecedor.nome } : null,
    };
  }

  async traceability(loteId: string, user: { empresaId: string }) {
    const balance = await this.balance(loteId, user);
    const movements = await this.dataSource.getRepository(EstoqueMovimento).find({
      where: { loteId, empresaId: user.empresaId },
      order: { criadoEm: 'ASC' },
    });
    return { ...balance, movements };
  }

  async available(user: { empresaId: string }) {
    return this.dataSource.getRepository(LoteResina).find({
      where: { empresaId: user.empresaId, ativo: true, status: 'DISPONIVEL' },
      relations: ['resina', 'fornecedor'],
      order: { codigo: 'ASC' },
    });
  }

  async applyMovement(
    manager: EntityManager,
    input: {
      empresaId: string;
      unidadeId?: string;
      loteId: string;
      tipoMovimento: StockMovementType;
      origemTipo: string;
      origemId?: string | null;
      quantidadeKg: number;
      custoUnitarioAplicado?: number;
      observacao?: string | null;
      motivo?: string | null;
      movimentoEstornadoId?: string | null;
      idempotencyKey: string;
      criadoPor?: string | null;
    },
  ): Promise<EstoqueMovimento> {
    const existing = await manager.getRepository(EstoqueMovimento).findOne({
      where: { idempotencyKey: input.idempotencyKey, empresaId: input.empresaId },
    });
    if (existing) return existing;
    const quantidade = round3(input.quantidadeKg);
    if (quantidade <= 0) throw new BadRequestException('Quantidade deve ser maior que zero.');

    const lote = await manager
      .getRepository(LoteResina)
      .createQueryBuilder('lote')
      .setLock('pessimistic_write')
      .where('lote.id = :id and lote.empresaId = :empresaId', {
        id: input.loteId,
        empresaId: input.empresaId,
      })
      .getOne();
    if (!lote) throw new NotFoundException('Lote nao encontrado.');
    if (!lote.ativo || lote.status === 'BLOQUEADO' || lote.status === 'INATIVO') {
      throw new ConflictException('Lote indisponivel para movimentacao.');
    }

    const saldoAnterior = round3(Number(lote.saldoAtualKg));
    const sinal = OUT_TYPES.has(input.tipoMovimento) ? -1 : 1;
    const saldoPosterior = round3(saldoAnterior + sinal * quantidade);
    if (saldoPosterior < 0) throw new ConflictException('Saldo insuficiente para movimentacao.');

    const custoUnitario =
      input.custoUnitarioAplicado ?? (lote.custoPorKg ? Number(lote.custoPorKg) : undefined);
    const unidadeId = input.unidadeId ?? (await this.resolveUnidadeId(manager, input.empresaId));
    const movimento = manager.getRepository(EstoqueMovimento).create({
      empresaId: input.empresaId,
      unidadeId,
      loteId: lote.id,
      tipoMovimento: input.tipoMovimento,
      origemTipo: input.origemTipo,
      origemId: input.origemId ?? null,
      quantidadeKg: quantidade.toFixed(3),
      saldoAnteriorKg: saldoAnterior.toFixed(3),
      saldoPosteriorKg: saldoPosterior.toFixed(3),
      custoUnitarioAplicado: custoUnitario === undefined ? null : round4(custoUnitario).toFixed(4),
      custoTotalAplicado:
        custoUnitario === undefined ? null : round4(custoUnitario * quantidade).toFixed(4),
      observacao: input.observacao ?? null,
      motivo: input.motivo ?? null,
      movimentoEstornadoId: input.movimentoEstornadoId ?? null,
      idempotencyKey: input.idempotencyKey,
      criadoPor: input.criadoPor ?? null,
    });
    await manager.query(`SET LOCAL app.allow_lote_saldo_update = 'on'`);
    lote.saldoAtualKg = saldoPosterior.toFixed(3);
    lote.status =
      saldoPosterior === 0 ? 'ESGOTADO' : lote.status === 'ESGOTADO' ? 'DISPONIVEL' : lote.status;
    await manager.getRepository(LoteResina).save(lote);
    const saved = await manager.getRepository(EstoqueMovimento).save(movimento);
    await this.auditoria.registrar({
      entidade: 'estoque_movimento',
      entidadeId: saved.id,
      acao: 'CREATE',
      usuarioId: input.criadoPor ?? null,
      dadosDepois: saved as unknown as Record<string, unknown>,
    });
    return saved;
  }

  private calculateRecordConsumptionKg(record: Apontamento): number {
    const pesoKg = Number(record.pesoPecaAplicadoG) / 1000;
    const pecas =
      (record.pecasBoas ?? 0) + (record.pecasRefugo ?? 0) + (record.falhaPreenchimentoQtd ?? 0);
    return round3(
      pecas * pesoKg +
        Number(record.borraKg ?? 0) +
        Number(record.galhoKg ?? 0) +
        Number(record.outrasPerdasKg ?? 0),
    );
  }

  private async resolveUnidadeId(manager: EntityManager, empresaId: string): Promise<string> {
    const unidade = await manager
      .getRepository(Unidade)
      .findOne({ where: { empresaId, ativo: true } });
    if (!unidade)
      throw new BadRequestException('Empresa sem unidade ativa para movimentacao de estoque.');
    return unidade.id;
  }

  private deterministicUuid(id: string, suffix: string): string {
    const raw = `${id.replace(/-/g, '').slice(0, 24)}${Buffer.from(suffix).toString('hex').slice(0, 8)}`;
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 32)}`;
  }
}

function deriveKey(base: string, index: number): string {
  const raw = `${base.replace(/-/g, '').slice(0, 30)}${index.toString(16).padStart(2, '0')}`;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 32)}`;
}

export function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
