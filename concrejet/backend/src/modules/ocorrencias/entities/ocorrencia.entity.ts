import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Empresa } from '../../organizacao/entities/empresa.entity';
import { Unidade } from '../../organizacao/entities/unidade.entity';
import { Dispositivo } from '../../producao-base/entities/dispositivo.entity';
import { Maquina } from '../../producao-base/entities/maquina.entity';
import { Apontamento } from '../../producao/entities/apontamento.entity';
import { Colaborador, TipoOcorrencia } from '../../cadastros/entities';

export type OccurrenceClassification = 'produtiva' | 'nao_produtiva';
export type OccurrenceScheduling = 'programada' | 'nao_programada';
export type OccurrenceStatus =
  | 'aberta'
  | 'aguardando_acao'
  | 'aguardando_aprovacao'
  | 'encerrada'
  | 'cancelada';

@Entity('ocorrencia')
@Index('idx_ocorrencia_empresa', ['empresaId'])
@Index('idx_ocorrencia_unidade', ['unidadeId'])
@Index('idx_ocorrencia_maquina', ['maquinaId'])
@Index('idx_ocorrencia_dispositivo', ['dispositivoId'])
@Index('idx_ocorrencia_apontamento', ['apontamentoId'])
@Index('idx_ocorrencia_operador', ['operadorId'])
@Index('idx_ocorrencia_tipo', ['tipoOcorrenciaId'])
@Index('idx_ocorrencia_inicio', ['inicioEm'])
@Index('idx_ocorrencia_status', ['status'])
@Index('idx_ocorrencia_idempotency_key', ['idempotencyKey'], { unique: true })
export class Ocorrencia extends BaseEntity {
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

  @ManyToOne(() => Apontamento, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'apontamento_id' })
  apontamento!: Apontamento;

  @Column({ name: 'apontamento_id' })
  apontamentoId!: string;

  @ManyToOne(() => Maquina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'maquina_id' })
  maquina!: Maquina;

  @Column({ name: 'maquina_id' })
  maquinaId!: string;

  @ManyToOne(() => Dispositivo, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'dispositivo_id' })
  dispositivo!: Dispositivo;

  @Column({ name: 'dispositivo_id' })
  dispositivoId!: string;

  @ManyToOne(() => Colaborador, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'operador_id' })
  operador!: Colaborador;

  @Column({ name: 'operador_id' })
  operadorId!: string;

  @ManyToOne(() => TipoOcorrencia, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'tipo_ocorrencia_id' })
  tipoOcorrencia!: TipoOcorrencia;

  @Column({ name: 'tipo_ocorrencia_id' })
  tipoOcorrenciaId!: string;

  @Column({ type: 'varchar', length: 20 })
  classificacao!: OccurrenceClassification;

  @Column({ type: 'varchar', length: 20 })
  programacao!: OccurrenceScheduling;

  @Column({ name: 'entra_calculo_oee', type: 'boolean', default: true })
  entraCalculoOee!: boolean;

  @Column({ name: 'inicio_em', type: 'timestamptz' })
  inicioEm!: Date;

  @Column({ name: 'fim_em', type: 'timestamptz', nullable: true })
  fimEm?: Date | null;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({ type: 'text', nullable: true })
  causa?: string | null;

  @Column({ name: 'acao_corretiva', type: 'text', nullable: true })
  acaoCorretiva?: string | null;

  @Column({ name: 'responsavel_acao_id', type: 'uuid', nullable: true })
  responsavelAcaoId?: string | null;

  @Column({ name: 'exige_acao_corretiva_aplicado', type: 'boolean', default: false })
  exigeAcaoCorretivaAplicado!: boolean;

  @Column({ name: 'exige_aprovacao_aplicado', type: 'boolean', default: false })
  exigeAprovacaoAplicado!: boolean;

  @Column({ name: 'aprovada_por', type: 'uuid', nullable: true })
  aprovadaPor?: string | null;

  @Column({ name: 'aprovada_em', type: 'timestamptz', nullable: true })
  aprovadaEm?: Date | null;

  @Column({ type: 'varchar', length: 30 })
  status!: OccurrenceStatus;

  @Column({ name: 'idempotency_key' })
  idempotencyKey!: string;

  @Column({ name: 'motivo_cancelamento', type: 'text', nullable: true })
  motivoCancelamento?: string | null;

  @Column({ name: 'encerrada_por', type: 'uuid', nullable: true })
  encerradaPor?: string | null;

  @Column({ name: 'encerrada_em', type: 'timestamptz', nullable: true })
  encerradaEm?: Date | null;

  @Column({ name: 'cancelada_por', type: 'uuid', nullable: true })
  canceladaPor?: string | null;

  @Column({ name: 'cancelada_em', type: 'timestamptz', nullable: true })
  canceladaEm?: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;
}
