import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LoteResina } from '../cadastros/entities';
import { Empresa } from '../organizacao/entities/empresa.entity';
import { Unidade } from '../organizacao/entities/unidade.entity';

export type StockMovementType =
  | 'entrada'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'consumo'
  | 'devolucao'
  | 'transferencia_entrada'
  | 'transferencia_saida'
  | 'blenda_consumo'
  | 'blenda_producao'
  | 'estorno';

@Entity('estoque_movimento')
@Unique('uq_estoque_movimento_idempotency', ['idempotencyKey'])
@Index('idx_estoque_movimento_lote_data', ['loteId', 'criadoEm'])
@Index('idx_estoque_movimento_origem', ['origemTipo', 'origemId'])
export class EstoqueMovimento extends BaseEntity {
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

  @ManyToOne(() => LoteResina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'lote_id' })
  lote!: LoteResina;

  @Column({ name: 'lote_id' })
  loteId!: string;

  @Column({ name: 'tipo_movimento', type: 'varchar', length: 40 })
  tipoMovimento!: StockMovementType;

  @Column({ name: 'origem_tipo', type: 'varchar', length: 60 })
  origemTipo!: string;

  @Column({ name: 'origem_id', type: 'uuid', nullable: true })
  origemId?: string | null;

  @Column({ name: 'quantidade_kg', type: 'numeric', precision: 12, scale: 3 })
  quantidadeKg!: string;

  @Column({ name: 'saldo_anterior_kg', type: 'numeric', precision: 12, scale: 3 })
  saldoAnteriorKg!: string;

  @Column({ name: 'saldo_posterior_kg', type: 'numeric', precision: 12, scale: 3 })
  saldoPosteriorKg!: string;

  @Column({
    name: 'custo_unitario_aplicado',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  custoUnitarioAplicado?: string | null;

  @Column({
    name: 'custo_total_aplicado',
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  custoTotalAplicado?: string | null;

  @Column({ type: 'text', nullable: true })
  observacao?: string | null;

  @Column({ type: 'text', nullable: true })
  motivo?: string | null;

  @Column({ name: 'movimento_estornado_id', type: 'uuid', nullable: true })
  movimentoEstornadoId?: string | null;

  @Column({ name: 'idempotency_key', type: 'uuid' })
  idempotencyKey!: string;

  @Column({ name: 'criado_por', type: 'uuid', nullable: true })
  criadoPor?: string | null;
}

export type BlendaStatus = 'rascunho' | 'em_processamento' | 'concluida' | 'cancelada';

@Entity('blenda')
@Unique('uq_blenda_empresa_codigo', ['empresaId', 'codigo'])
export class Blenda extends BaseEntity {
  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @Column({ name: 'unidade_id' })
  unidadeId!: string;

  @Column({ type: 'varchar', length: 60 })
  codigo!: string;

  @Column({ type: 'varchar', length: 180 })
  descricao!: string;

  @Column({ name: 'data_hora', type: 'timestamptz' })
  dataHora!: Date;

  @Column({ name: 'quantidade_planejada_kg', type: 'numeric', precision: 12, scale: 3 })
  quantidadePlanejadaKg!: string;

  @Column({
    name: 'quantidade_resultante_kg',
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  quantidadeResultanteKg?: string | null;

  @Column({ name: 'perda_processo_kg', type: 'numeric', precision: 12, scale: 3, nullable: true })
  perdaProcessoKg?: string | null;

  @Column({ name: 'lote_resultante_id', type: 'uuid', nullable: true })
  loteResultanteId?: string | null;

  @Column({ type: 'varchar', length: 30, default: 'rascunho' })
  status!: BlendaStatus;

  @Column({ type: 'text', nullable: true })
  observacao?: string | null;

  @Column({ name: 'criado_por', type: 'uuid', nullable: true })
  criadoPor?: string | null;

  @Column({ name: 'concluido_por', type: 'uuid', nullable: true })
  concluidoPor?: string | null;

  @Column({ name: 'concluido_em', type: 'timestamptz', nullable: true })
  concluidoEm?: Date | null;

  @Column({ name: 'cancelado_por', type: 'uuid', nullable: true })
  canceladoPor?: string | null;

  @Column({ name: 'cancelado_em', type: 'timestamptz', nullable: true })
  canceladoEm?: Date | null;

  @Column({ name: 'motivo_cancelamento', type: 'text', nullable: true })
  motivoCancelamento?: string | null;

  @OneToMany(() => BlendaComponente, (componente) => componente.blenda)
  componentes!: BlendaComponente[];
}

@Entity('blenda_componente')
export class BlendaComponente extends BaseEntity {
  @ManyToOne(() => Blenda, (blenda) => blenda.componentes, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'blenda_id' })
  blenda!: Blenda;

  @Column({ name: 'blenda_id' })
  blendaId!: string;

  @ManyToOne(() => LoteResina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'lote_origem_id' })
  loteOrigem!: LoteResina;

  @Column({ name: 'lote_origem_id' })
  loteOrigemId!: string;

  @Column({ name: 'quantidade_kg', type: 'numeric', precision: 12, scale: 3 })
  quantidadeKg!: string;

  @Column({ name: 'percentual_calculado', type: 'numeric', precision: 8, scale: 4 })
  percentualCalculado!: string;

  @Column({
    name: 'custo_unitario_aplicado',
    type: 'numeric',
    precision: 12,
    scale: 4,
    nullable: true,
  })
  custoUnitarioAplicado?: string | null;

  @Column({
    name: 'custo_total_aplicado',
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  custoTotalAplicado?: string | null;
}

@Entity('calendario_turno')
export class CalendarioTurno extends BaseEntity {
  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @Column({ name: 'unidade_id' })
  unidadeId!: string;

  @Column({ name: 'maquina_id', type: 'uuid', nullable: true })
  maquinaId?: string | null;

  @Column({ name: 'dia_semana', type: 'integer' })
  diaSemana!: number;

  @Column({ name: 'inicio_hora', type: 'time' })
  inicioHora!: string;

  @Column({ name: 'fim_hora', type: 'time' })
  fimHora!: string;

  @Column({ name: 'vigencia_inicio', type: 'date' })
  vigenciaInicio!: string;

  @Column({ name: 'vigencia_fim', type: 'date', nullable: true })
  vigenciaFim?: string | null;

  @Column({ name: 'intervalos_excluidos', type: 'jsonb', default: () => "'[]'::jsonb" })
  intervalosExcluidos!: Array<{ inicio: string; fim: string; motivo?: string }>;

  @Column({
    name: 'indisponibilidades_planejadas',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  indisponibilidadesPlanejadas!: Array<{ inicio: string; fim: string; motivo?: string }>;

  @Column({ type: 'text', nullable: true })
  observacao?: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
