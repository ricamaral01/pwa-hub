import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LoteResina } from '../cadastros/entities';
import { Unidade } from '../organizacao/entities/unidade.entity';
import { CreateBlendDto, FinishBlendDto, UpdateBlendDto, CancelBlendDto } from './dto';
import { Blenda, BlendaComponente } from './entities';
import { round3, round4, StockMovementsService } from './stock-movements.service';

@Injectable()
export class BlendsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stock: StockMovementsService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateBlendDto, user: { sub: string; empresaId: string }) {
    return this.dataSource.transaction(async (manager) => {
      const calc = await this.calculateInternal(dto.componentes, user.empresaId);
      const blenda = await manager.getRepository(Blenda).save(
        manager.getRepository(Blenda).create({
          empresaId: user.empresaId,
          unidadeId: calc.unidadeId,
          codigo: dto.codigo.trim(),
          descricao: dto.descricao.trim(),
          dataHora: new Date(),
          quantidadePlanejadaKg: round3(dto.quantidadePlanejadaKg).toFixed(3),
          status: 'rascunho',
          observacao: dto.observacao ?? null,
          criadoPor: user.sub,
        }),
      );
      await manager.getRepository(BlendaComponente).save(
        calc.componentes.map((item) =>
          manager.getRepository(BlendaComponente).create({
            blendaId: blenda.id,
            loteOrigemId: item.loteOrigemId,
            quantidadeKg: item.quantidadeKg.toFixed(3),
            percentualCalculado: item.percentualCalculado.toFixed(4),
            custoUnitarioAplicado:
              item.custoUnitarioAplicado === null ? null : item.custoUnitarioAplicado.toFixed(4),
            custoTotalAplicado:
              item.custoTotalAplicado === null ? null : item.custoTotalAplicado.toFixed(4),
          }),
        ),
      );
      await this.audit(blenda.id, 'CREATE', user.sub, blenda);
      return this.get(blenda.id, user);
    });
  }

  async calculate(
    dto:
      | CreateBlendDto
      | { componentes: CreateBlendDto['componentes']; quantidadeResultanteKg?: number },
    user: { empresaId: string },
  ) {
    const calc = await this.calculateInternal(dto.componentes, user.empresaId);
    const quantidadeResultanteKg =
      'quantidadeResultanteKg' in dto && dto.quantidadeResultanteKg
        ? round3(dto.quantidadeResultanteKg)
        : calc.massaEntradaKg;
    if (quantidadeResultanteKg <= 0)
      throw new BadRequestException('Quantidade resultante deve ser maior que zero.');
    const perdaProcessoKg = round3(calc.massaEntradaKg - quantidadeResultanteKg);
    if (perdaProcessoKg < 0)
      throw new BadRequestException('Quantidade resultante nao pode superar a massa de entrada.');
    return {
      ...calc,
      quantidadeResultanteKg,
      perdaProcessoKg,
      custoUnitarioResultante:
        calc.custoTotalComponentes === null
          ? null
          : round4(calc.custoTotalComponentes / quantidadeResultanteKg),
    };
  }

  async update(id: string, dto: UpdateBlendDto, user: { sub: string; empresaId: string }) {
    return this.dataSource.transaction(async (manager) => {
      const blenda = await manager
        .getRepository(Blenda)
        .findOne({ where: { id, empresaId: user.empresaId } });
      if (!blenda) throw new NotFoundException('Blenda nao encontrada.');
      if (blenda.status !== 'rascunho')
        throw new ConflictException('Somente blenda em rascunho pode ser alterada.');
      if (dto.descricao) blenda.descricao = dto.descricao.trim();
      if (dto.observacao !== undefined) blenda.observacao = dto.observacao;
      await manager.getRepository(Blenda).save(blenda);
      if (dto.componentes) {
        const calc = await this.calculateInternal(dto.componentes, user.empresaId);
        await manager.getRepository(BlendaComponente).delete({ blendaId: id });
        await manager.getRepository(BlendaComponente).save(
          calc.componentes.map((item) =>
            manager.getRepository(BlendaComponente).create({
              blendaId: id,
              loteOrigemId: item.loteOrigemId,
              quantidadeKg: item.quantidadeKg.toFixed(3),
              percentualCalculado: item.percentualCalculado.toFixed(4),
              custoUnitarioAplicado:
                item.custoUnitarioAplicado === null ? null : item.custoUnitarioAplicado.toFixed(4),
              custoTotalAplicado:
                item.custoTotalAplicado === null ? null : item.custoTotalAplicado.toFixed(4),
            }),
          ),
        );
      }
      await this.audit(id, 'UPDATE', user.sub, blenda);
      return this.get(id, user);
    });
  }

  async finish(id: string, dto: FinishBlendDto, user: { sub: string; empresaId: string }) {
    return this.dataSource.transaction(async (manager) => {
      const blenda = await manager.getRepository(Blenda).findOne({
        where: { id, empresaId: user.empresaId },
        relations: ['componentes'],
      });
      if (!blenda) throw new NotFoundException('Blenda nao encontrada.');
      if (blenda.status !== 'rascunho' && blenda.status !== 'em_processamento') {
        throw new ConflictException('Blenda nao pode ser concluida neste status.');
      }
      const loteResultante = await manager.getRepository(LoteResina).findOne({
        where: { id: dto.loteResultanteId, empresaId: user.empresaId, ativo: true },
      });
      if (!loteResultante) throw new BadRequestException('Lote resultante nao encontrado.');
      const massaEntrada = round3(
        blenda.componentes.reduce((sum, item) => sum + Number(item.quantidadeKg), 0),
      );
      const quantidadeResultante = round3(dto.quantidadeResultanteKg);
      const perda = round3(massaEntrada - quantidadeResultante);
      if (perda < 0)
        throw new BadRequestException('Quantidade resultante nao pode superar a massa de entrada.');
      for (const [index, componente] of blenda.componentes.entries()) {
        await this.stock.applyMovement(manager, {
          empresaId: user.empresaId,
          unidadeId: blenda.unidadeId,
          loteId: componente.loteOrigemId,
          tipoMovimento: 'blenda_consumo',
          origemTipo: 'blenda',
          origemId: blenda.id,
          quantidadeKg: Number(componente.quantidadeKg),
          custoUnitarioAplicado: componente.custoUnitarioAplicado
            ? Number(componente.custoUnitarioAplicado)
            : undefined,
          idempotencyKey: deriveKey(dto.idempotencyKey, index),
          criadoPor: user.sub,
        });
      }
      await this.stock.applyMovement(manager, {
        empresaId: user.empresaId,
        unidadeId: blenda.unidadeId,
        loteId: loteResultante.id,
        tipoMovimento: 'blenda_producao',
        origemTipo: 'blenda',
        origemId: blenda.id,
        quantidadeKg: quantidadeResultante,
        idempotencyKey: deriveKey(dto.idempotencyKey, 99),
        criadoPor: user.sub,
      });
      blenda.status = 'concluida';
      blenda.quantidadeResultanteKg = quantidadeResultante.toFixed(3);
      blenda.perdaProcessoKg = perda.toFixed(3);
      blenda.loteResultanteId = loteResultante.id;
      blenda.concluidoPor = user.sub;
      blenda.concluidoEm = new Date();
      await manager.getRepository(Blenda).save(blenda);
      await this.audit(id, 'UPDATE', user.sub, blenda);
      return this.get(id, user);
    });
  }

  async cancel(id: string, dto: CancelBlendDto, user: { sub: string; empresaId: string }) {
    if (!dto.motivoCancelamento.trim())
      throw new BadRequestException('Cancelamento exige justificativa.');
    return this.dataSource.transaction(async (manager) => {
      const blenda = await manager
        .getRepository(Blenda)
        .findOne({ where: { id, empresaId: user.empresaId } });
      if (!blenda) throw new NotFoundException('Blenda nao encontrada.');
      if (blenda.status === 'cancelada') return blenda;
      if (blenda.status === 'concluida') {
        const movements = (await manager
          .getRepository('estoque_movimento')
          .find({ where: { origemTipo: 'blenda', origemId: id } as never })) as Array<{
          id: string;
        }>;
        for (const [index, movement] of movements.entries()) {
          await this.stock.reverse(
            movement.id,
            {
              motivo: dto.motivoCancelamento,
              idempotencyKey: deriveKey(dto.idempotencyKey, index),
            },
            user,
          );
        }
      }
      blenda.status = 'cancelada';
      blenda.canceladoPor = user.sub;
      blenda.canceladoEm = new Date();
      blenda.motivoCancelamento = dto.motivoCancelamento.trim();
      await manager.getRepository(Blenda).save(blenda);
      await this.audit(id, 'UPDATE', user.sub, blenda);
      return blenda;
    });
  }

  async list(user: { empresaId: string }, query: Record<string, unknown>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const [data, total] = await this.dataSource.getRepository(Blenda).findAndCount({
      where: { empresaId: user.empresaId },
      order: { criadoEm: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  async get(id: string, user: { empresaId: string }) {
    const blenda = await this.dataSource.getRepository(Blenda).findOne({
      where: { id, empresaId: user.empresaId },
      relations: ['componentes'],
    });
    if (!blenda) throw new NotFoundException('Blenda nao encontrada.');
    return blenda;
  }

  async traceability(id: string, user: { empresaId: string }) {
    const blenda = await this.get(id, user);
    const movements = (await this.dataSource
      .getRepository('estoque_movimento')
      .find({ where: { origemTipo: 'blenda', origemId: id } as never })) as unknown[];
    return { blenda, movements };
  }

  private async calculateInternal(componentes: CreateBlendDto['componentes'], empresaId: string) {
    if (componentes.length < 2)
      throw new BadRequestException('Blenda exige pelo menos dois componentes.');
    const ids = new Set(componentes.map((item) => item.loteOrigemId));
    if (ids.size !== componentes.length)
      throw new BadRequestException('Nao repita o mesmo lote na blenda.');
    const lotes = await this.dataSource
      .getRepository(LoteResina)
      .findBy([...ids].map((id) => ({ id, empresaId, ativo: true })));
    if (lotes.length !== ids.size)
      throw new BadRequestException('Um ou mais lotes de origem nao foram encontrados.');
    const massaEntradaKg = round3(componentes.reduce((sum, item) => sum + item.quantidadeKg, 0));
    if (massaEntradaKg <= 0)
      throw new BadRequestException('Massa de entrada deve ser maior que zero.');
    const enriched = componentes.map((item) => {
      const lote = lotes.find((candidate) => candidate.id === item.loteOrigemId)!;
      if (lote.status !== 'DISPONIVEL')
        throw new ConflictException(`Lote ${lote.codigo} indisponivel.`);
      if (Number(lote.saldoAtualKg) < item.quantidadeKg)
        throw new ConflictException(`Saldo insuficiente no lote ${lote.codigo}.`);
      const custoUnitario = lote.custoPorKg ? round4(Number(lote.custoPorKg)) : null;
      return {
        loteOrigemId: item.loteOrigemId,
        quantidadeKg: round3(item.quantidadeKg),
        percentualCalculado: round4((item.quantidadeKg / massaEntradaKg) * 100),
        custoUnitarioAplicado: custoUnitario,
        custoTotalAplicado:
          custoUnitario === null ? null : round4(custoUnitario * item.quantidadeKg),
      };
    });
    const custoTotal = enriched.every((item) => item.custoTotalAplicado !== null)
      ? round4(enriched.reduce((sum, item) => sum + Number(item.custoTotalAplicado), 0))
      : null;
    const unidade = await this.dataSource
      .getRepository(Unidade)
      .findOne({ where: { empresaId, ativo: true } });
    if (!unidade) throw new BadRequestException('Empresa sem unidade ativa para blenda.');
    return {
      unidadeId: unidade.id,
      massaEntradaKg,
      custoTotalComponentes: custoTotal,
      componentes: enriched,
    };
  }

  private async audit(
    id: string,
    acao: 'CREATE' | 'UPDATE',
    usuarioId: string,
    dadosDepois: unknown,
  ) {
    await this.auditoria.registrar({
      entidade: 'blenda',
      entidadeId: id,
      acao,
      usuarioId,
      dadosDepois: dadosDepois as Record<string, unknown>,
    });
  }
}

function deriveKey(base: string, index: number): string {
  const raw = `${base.replace(/-/g, '').slice(0, 30)}${index.toString(16).padStart(2, '0')}`;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 32)}`;
}
