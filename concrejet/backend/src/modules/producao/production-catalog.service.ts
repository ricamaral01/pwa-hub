import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, IsNull, LessThanOrEqual, MoreThan, MoreThanOrEqual } from 'typeorm';
import {
  ConfiguracaoItemMolde,
  LoteResina,
  Operacao,
  OrdemProducao,
  TipoOcorrencia,
} from '../cadastros/entities';
import type { OperationalUser } from '../auth/operator-session.guard';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';

@Injectable()
export class ProductionCatalogService {
  constructor(private readonly dataSource: DataSource) {}

  async getCatalog(user: OperationalUser) {
    const now = new Date();
    const [dispositivo, operacoes, ordens, lotes] = await Promise.all([
      this.dataSource.getRepository(Dispositivo).findOne({
        where: { id: user.dispositivoId, ativo: true },
        relations: ['maquina'],
      }),
      this.dataSource.getRepository(Operacao).find({
        where: { empresaId: user.empresaId, ativo: true },
        order: { codigo: 'ASC' },
      }),
      this.dataSource.getRepository(OrdemProducao).find({
        where: {
          empresaId: user.empresaId,
          unidadeId: user.unidadeId,
          ativo: true,
          status: 'ABERTA',
        },
        relations: ['item', 'molde'],
        order: { numero: 'ASC' },
      }),
      this.dataSource.getRepository(LoteResina).find({
        where: { empresaId: user.empresaId, ativo: true, status: 'DISPONIVEL' },
        relations: ['resina', 'fornecedor'],
        order: { codigo: 'ASC' },
      }),
    ]);

    const configuracoes = await this.dataSource.getRepository(ConfiguracaoItemMolde).find({
      where: [
        {
          empresaId: user.empresaId,
          ativo: true,
          vigenciaInicio: LessThanOrEqual(now),
          vigenciaFim: IsNull(),
        },
        {
          empresaId: user.empresaId,
          ativo: true,
          vigenciaInicio: LessThanOrEqual(now),
          vigenciaFim: MoreThan(now),
        },
      ],
      relations: ['molde'],
    });

    return {
      machine: dispositivo?.maquina
        ? {
            id: dispositivo.maquina.id,
            codigo: dispositivo.maquina.codigo,
            nome: dispositivo.maquina.nome,
          }
        : null,
      operations: operacoes.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        descricao: item.descricao,
      })),
      productionOrders: ordens.map((ordem) => ({
        id: ordem.id,
        numero: ordem.numero,
        quantidadePlanejada: ordem.quantidadePlanejada,
        status: ordem.status,
        item: {
          id: ordem.itemId,
          codigo: ordem.item.codigo,
          descricao: ordem.item.descricao,
        },
        molde: {
          id: ordem.moldeId,
          codigo: ordem.molde.codigo,
          descricao: ordem.molde.descricao,
        },
      })),
      moldsByItem: this.groupMolds(configuracoes),
      lots: lotes.map((lote) => ({
        id: lote.id,
        codigo: lote.codigo,
        saldoAtualKg: Number(lote.saldoAtualKg),
        status: lote.status,
        resina: lote.resina
          ? { id: lote.resina.id, codigo: lote.resina.codigo, descricao: lote.resina.descricao }
          : null,
        fornecedor: lote.fornecedor
          ? {
              id: lote.fornecedor.id,
              nome: lote.fornecedor.nome,
              documento: lote.fornecedor.documento,
            }
          : null,
      })),
      cache: {
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      },
    };
  }

  async getOccurrenceTypes(user: OperationalUser) {
    const data = await this.dataSource.getRepository(TipoOcorrencia).find({
      where: { empresaId: user.empresaId, ativo: true },
      order: { codigo: 'ASC' },
    });
    return {
      data: data.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        descricao: item.descricao,
        classificacaoPadrao: item.classificacaoPadrao,
        programacaoPadrao: item.programacaoPadrao,
        entraCalculoOee: item.entraCalculoOee,
        exigeAcaoCorretiva: item.exigeAcaoCorretiva,
        exigeAprovacao: item.exigeAprovacao,
      })),
    };
  }

  async getMoldsForItem(user: OperationalUser, itemId: string) {
    const configs = await this.currentConfigurations(user, itemId);
    return this.groupMolds(configs)[itemId] ?? [];
  }

  async getCurrentConfiguration(user: OperationalUser, itemId: string, moldeId: string) {
    const now = new Date();
    const config = await this.dataSource.getRepository(ConfiguracaoItemMolde).findOne({
      where: [
        {
          empresaId: user.empresaId,
          itemId,
          moldeId,
          ativo: true,
          vigenciaInicio: LessThanOrEqual(now),
          vigenciaFim: IsNull(),
        },
        {
          empresaId: user.empresaId,
          itemId,
          moldeId,
          ativo: true,
          vigenciaInicio: LessThanOrEqual(now),
          vigenciaFim: MoreThanOrEqual(now),
        },
      ],
    });
    if (!config) throw new BadRequestException('Item sem configuracao vigente para o molde.');
    return config;
  }

  private async currentConfigurations(user: OperationalUser, itemId: string) {
    const now = new Date();
    return this.dataSource.getRepository(ConfiguracaoItemMolde).find({
      where: [
        {
          empresaId: user.empresaId,
          itemId,
          ativo: true,
          vigenciaInicio: LessThanOrEqual(now),
          vigenciaFim: IsNull(),
        },
        {
          empresaId: user.empresaId,
          itemId,
          ativo: true,
          vigenciaInicio: LessThanOrEqual(now),
          vigenciaFim: MoreThan(now),
        },
      ],
      relations: ['molde'],
    });
  }

  private groupMolds(configs: ConfiguracaoItemMolde[]) {
    return configs.reduce<
      Record<
        string,
        Array<{ id: string; codigo: string; descricao: string; configuracaoId: string }>
      >
    >((acc, config) => {
      acc[config.itemId] ??= [];
      acc[config.itemId].push({
        id: config.moldeId,
        codigo: config.molde.codigo,
        descricao: config.molde.descricao,
        configuracaoId: config.id,
      });
      return acc;
    }, {});
  }
}
