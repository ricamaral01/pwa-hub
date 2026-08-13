import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Empresa } from '../../organizacao/entities/empresa.entity';
import { Unidade } from '../../organizacao/entities/unidade.entity';
import { Maquina } from '../../producao-base/entities/maquina.entity';
import { Dispositivo } from '../../producao-base/entities/dispositivo.entity';
import {
  Colaborador,
  ConfiguracaoItemMolde,
  Item,
  LoteResina,
  Molde,
  Operacao,
  OrdemProducao,
} from '../../cadastros/entities';

export type ApontamentoStatus = 'rascunho' | 'em_andamento' | 'concluido' | 'cancelado';
export type ApontamentoOrigem = 'tablet' | 'desktop' | 'importacao';

@Entity('apontamento')
@Index('idx_apontamento_maquina_inicio', ['maquinaId', 'inicioEm'])
@Index('idx_apontamento_idempotency_key', ['idempotencyKey'], { unique: true })
export class Apontamento extends BaseEntity {
  @ManyToOne(() => Empresa, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @ManyToOne(() => Unidade, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'unidade_id' })
  unidade!: Unidade;

  @Column({ name: 'unidade_id' })
  unidadeId!: string;

  @ManyToOne(() => Dispositivo, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'dispositivo_id' })
  dispositivo!: Dispositivo;

  @Column({ name: 'dispositivo_id' })
  dispositivoId!: string;

  @ManyToOne(() => Maquina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'maquina_id' })
  maquina!: Maquina;

  @Column({ name: 'maquina_id' })
  maquinaId!: string;

  @ManyToOne(() => Colaborador, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'operador_id' })
  operador!: Colaborador;

  @Column({ name: 'operador_id' })
  operadorId!: string;

  @ManyToOne(() => OrdemProducao, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'ordem_producao_id' })
  ordemProducao?: OrdemProducao | null;

  @Column({ name: 'ordem_producao_id', nullable: true })
  ordemProducaoId?: string | null;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => Molde, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'molde_id' })
  molde!: Molde;

  @Column({ name: 'molde_id' })
  moldeId!: string;

  @ManyToOne(() => ConfiguracaoItemMolde, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'configuracao_item_molde_id' })
  configuracaoItemMolde!: ConfiguracaoItemMolde;

  @Column({ name: 'configuracao_item_molde_id' })
  configuracaoItemMoldeId!: string;

  @ManyToOne(() => LoteResina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'lote_resina_id' })
  loteResina!: LoteResina;

  @Column({ name: 'lote_resina_id' })
  loteResinaId!: string;

  @ManyToOne(() => Operacao, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'operacao_id' })
  operacao!: Operacao;

  @Column({ name: 'operacao_id' })
  operacaoId!: string;

  @Column({ name: 'data_producao', type: 'date' })
  dataProducao!: string;

  @Column({ name: 'inicio_em', type: 'timestamptz' })
  inicioEm!: Date;

  @Column({ name: 'fim_em', type: 'timestamptz', nullable: true })
  fimEm?: Date | null;

  @Column({ name: 'ciclo_real_s', type: 'numeric', precision: 10, scale: 2, nullable: true })
  cicloRealS?: string | null;

  @Column({ name: 'pecas_boas', type: 'integer', default: 0 })
  pecasBoas!: number;

  @Column({ name: 'pecas_refugo', type: 'integer', default: 0 })
  pecasRefugo!: number;

  @Column({ name: 'falha_preenchimento_qtd', type: 'integer', default: 0 })
  falhaPreenchimentoQtd!: number;

  @Column({ name: 'borra_kg', type: 'numeric', precision: 12, scale: 3, default: 0 })
  borraKg!: string;

  @Column({ name: 'galho_kg', type: 'numeric', precision: 12, scale: 3, default: 0 })
  galhoKg!: string;

  @Column({ name: 'outras_perdas_kg', type: 'numeric', precision: 12, scale: 3, default: 0 })
  outrasPerdasKg!: string;

  @Column({ type: 'text', nullable: true })
  observacao?: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: ApontamentoStatus;

  @Column({ type: 'varchar', length: 20 })
  origem!: ApontamentoOrigem;

  @Column({ name: 'idempotency_key' })
  idempotencyKey!: string;

  @Column({ name: 'peso_peca_aplicado_g', type: 'numeric', precision: 12, scale: 3 })
  pesoPecaAplicadoG!: string;

  @Column({ name: 'cavidades_aplicadas', type: 'integer' })
  cavidadesAplicadas!: number;

  @Column({ name: 'ciclo_padrao_aplicado_s', type: 'numeric', precision: 8, scale: 2 })
  cicloPadraoAplicadoS!: string;

  @Column({
    name: 'ciclo_custo_aplicado_s',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  cicloCustoAplicadoS?: string | null;

  @Column({ name: 'limite_perda_aplicado_pct', type: 'numeric', precision: 5, scale: 2 })
  limitePerdaAplicadoPct!: string;

  @Column({
    name: 'custo_resina_aplicado_kg',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  custoResinaAplicadoKg?: string | null;

  @Column({ name: 'motivo_cancelamento', type: 'text', nullable: true })
  motivoCancelamento?: string | null;

  @Column({ name: 'cancelado_por', type: 'uuid', nullable: true })
  canceladoPor?: string | null;

  @Column({ name: 'cancelado_em', type: 'timestamptz', nullable: true })
  canceladoEm?: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;
}
