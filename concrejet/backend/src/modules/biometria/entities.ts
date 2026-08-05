import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Empresa } from '../organizacao/entities/empresa.entity';
import { Unidade } from '../organizacao/entities/unidade.entity';
import { Colaborador } from '../cadastros/entities';

@Entity('biometria_facial')
@Index('idx_biometria_facial_colaborador_ativa', [
  'empresaId',
  'unidadeId',
  'colaboradorId',
  'ativa',
])
export class BiometriaFacial extends BaseEntity {
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

  @ManyToOne(() => Colaborador, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'colaborador_id' })
  colaborador!: Colaborador;

  @Column({ name: 'colaborador_id' })
  colaboradorId!: string;

  @Column({ name: 'modelo_nome', length: 80 })
  modeloNome!: string;

  @Column({ name: 'modelo_versao', length: 40 })
  modeloVersao!: string;

  @Column({ name: 'template_criptografado', type: 'bytea' })
  templateCriptografado!: Buffer;

  @Column({ name: 'template_iv', type: 'bytea' })
  templateIv!: Buffer;

  @Column({ name: 'template_auth_tag', type: 'bytea' })
  templateAuthTag!: Buffer;

  @Column({ type: 'numeric', precision: 6, scale: 4 })
  qualidade!: string;

  @Column({ name: 'threshold_aplicado', type: 'numeric', precision: 6, scale: 4 })
  thresholdAplicado!: string;

  @Column({ type: 'boolean', default: true })
  ativa!: boolean;

  @Column({ name: 'emitida_em', type: 'timestamptz' })
  emitidaEm!: Date;

  @Column({ name: 'ultima_utilizacao_em', type: 'timestamptz', nullable: true })
  ultimaUtilizacaoEm?: Date | null;

  @Column({ name: 'revogada_em', type: 'timestamptz', nullable: true })
  revogadaEm?: Date | null;

  @Column({ name: 'revogada_por', nullable: true })
  revogadaPor?: string | null;

  @Column({ name: 'motivo_revogacao', type: 'text', nullable: true })
  motivoRevogacao?: string | null;

  @Column({ type: 'integer', default: 1 })
  version!: number;
}

@Entity('biometria_evento')
@Index('idx_biometria_evento_busca', ['empresaId', 'unidadeId', 'colaboradorId', 'criadoEm'])
export class BiometriaEvento extends BaseEntity {
  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @Column({ name: 'unidade_id' })
  unidadeId!: string;

  @Column({ name: 'colaborador_id', nullable: true })
  colaboradorId?: string | null;

  @Column({ name: 'dispositivo_id', nullable: true })
  dispositivoId?: string | null;

  @Column({ name: 'maquina_id', nullable: true })
  maquinaId?: string | null;

  @Column({ name: 'tipo_evento', length: 40 })
  tipoEvento!: string;

  @Column({ length: 40 })
  resultado!: string;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true })
  similaridade?: string | null;

  @Column({ type: 'text', nullable: true })
  motivo?: string | null;

  @Column({ name: 'correlation_id', nullable: true })
  correlationId?: string | null;
}
