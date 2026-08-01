import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Empresa } from '../organizacao/entities/empresa.entity';
import { Unidade } from '../organizacao/entities/unidade.entity';

abstract class CadastroEmpresaEntity extends BaseEntity {
  @ManyToOne(() => Empresa, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @Column({ name: 'criado_por_usuario_id', nullable: true })
  criadoPorUsuarioId?: string;

  @Column({ name: 'atualizado_por_usuario_id', nullable: true })
  atualizadoPorUsuarioId?: string;
}

abstract class CadastroUnidadeEntity extends CadastroEmpresaEntity {
  @ManyToOne(() => Unidade, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'unidade_id' })
  unidade!: Unidade;

  @Column({ name: 'unidade_id' })
  unidadeId!: string;
}

@Entity('funcao')
@Unique('uq_funcao_empresa_codigo', ['empresaId', 'codigo'])
export class Funcao extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 40 })
  codigo!: string;

  @Column({ type: 'varchar', length: 120 })
  descricao!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('colaborador')
@Unique('uq_colaborador_empresa_matricula', ['empresaId', 'matricula'])
export class Colaborador extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 40 })
  matricula!: string;

  @Column({ type: 'varchar', length: 160 })
  nome!: string;

  @Column({ name: 'funcao_id' })
  funcaoId!: string;

  @ManyToOne(() => Funcao, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'funcao_id' })
  funcao!: Funcao;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('operacao')
@Unique('uq_operacao_empresa_codigo', ['empresaId', 'codigo'])
export class Operacao extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 40 })
  codigo!: string;

  @Column({ type: 'varchar', length: 140 })
  descricao!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('tipo_ocorrencia')
@Unique('uq_tipo_ocorrencia_empresa_codigo', ['empresaId', 'codigo'])
export class TipoOcorrencia extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 40 })
  codigo!: string;

  @Column({ type: 'varchar', length: 140 })
  descricao!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('fornecedor')
@Unique('uq_fornecedor_empresa_documento', ['empresaId', 'documento'])
export class Fornecedor extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 160 })
  nome!: string;

  @Column({ type: 'varchar', length: 32 })
  documento!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('resina')
@Unique('uq_resina_empresa_codigo', ['empresaId', 'codigo'])
export class Resina extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 40 })
  codigo!: string;

  @Column({ type: 'varchar', length: 140 })
  descricao!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  fabricante?: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('lote_resina')
@Unique('uq_lote_resina_empresa_codigo', ['empresaId', 'codigo'])
export class LoteResina extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 60 })
  codigo!: string;

  @Column({ name: 'resina_id' })
  resinaId!: string;

  @ManyToOne(() => Resina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'resina_id' })
  resina!: Resina;

  @Column({ name: 'fornecedor_id' })
  fornecedorId!: string;

  @ManyToOne(() => Fornecedor, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor!: Fornecedor;

  @Column({ name: 'quantidade_inicial_kg', type: 'numeric', precision: 12, scale: 3 })
  quantidadeInicialKg!: string;

  @Column({ name: 'saldo_atual_kg', type: 'numeric', precision: 12, scale: 3 })
  saldoAtualKg!: string;

  @Column({ name: 'data_recebimento', type: 'date' })
  dataRecebimento!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('movimento_estoque_lote')
@Index('idx_movimento_lote_resina_lote', ['loteResinaId'])
export class MovimentoEstoqueLote extends CadastroEmpresaEntity {
  @Column({ name: 'lote_resina_id' })
  loteResinaId!: string;

  @ManyToOne(() => LoteResina, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'lote_resina_id' })
  loteResina!: LoteResina;

  @Column({ type: 'varchar', length: 20 })
  tipo!: 'ENTRADA' | 'SAIDA' | 'AJUSTE';

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantidadeKg!: string;

  @Column({ type: 'text', nullable: true })
  observacao?: string;
}

@Entity('item')
@Unique('uq_item_empresa_codigo', ['empresaId', 'codigo'])
export class Item extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 60 })
  codigo!: string;

  @Column({ type: 'varchar', length: 180 })
  descricao!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('molde')
@Unique('uq_molde_empresa_codigo', ['empresaId', 'codigo'])
export class Molde extends CadastroEmpresaEntity {
  @Column({ type: 'varchar', length: 60 })
  codigo!: string;

  @Column({ type: 'varchar', length: 160 })
  descricao!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('configuracao_item_molde')
@Index('idx_config_item_molde', ['itemId', 'moldeId'])
export class ConfiguracaoItemMolde extends CadastroEmpresaEntity {
  @Column({ name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'molde_id' })
  moldeId!: string;

  @ManyToOne(() => Molde, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'molde_id' })
  molde!: Molde;

  @Column({ name: 'peso_peca_g', type: 'numeric', precision: 12, scale: 3 })
  pesoPecaG!: string;

  @Column({ name: 'ciclo_padrao_segundos', type: 'integer' })
  cicloPadraoSegundos!: number;

  @Column({ name: 'cavidades', type: 'integer' })
  cavidades!: number;

  @Column({ name: 'vigencia_inicio', type: 'timestamptz' })
  vigenciaInicio!: Date;

  @Column({ name: 'vigencia_fim', type: 'timestamptz', nullable: true })
  vigenciaFim?: Date | null;

  @Column({ name: 'motivo_alteracao', type: 'text', nullable: true })
  motivoAlteracao?: string;

  @Column({ type: 'integer', default: 1 })
  versaoConfiguracao!: number;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

@Entity('ordem_producao')
@Unique('uq_ordem_producao_empresa_numero', ['empresaId', 'numero'])
export class OrdemProducao extends CadastroUnidadeEntity {
  @Column({ type: 'varchar', length: 60 })
  numero!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'molde_id' })
  moldeId!: string;

  @ManyToOne(() => Molde, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'molde_id' })
  molde!: Molde;

  @Column({ name: 'quantidade_planejada', type: 'integer' })
  quantidadePlanejada!: number;

  @Column({ name: 'data_inicio_planejada', type: 'date' })
  dataInicioPlanejada!: string;

  @Column({ name: 'data_fim_planejada', type: 'date', nullable: true })
  dataFimPlanejada?: string;

  @Column({ type: 'varchar', length: 20, default: 'ABERTA' })
  status!: 'ABERTA' | 'CANCELADA' | 'ENCERRADA';

  @Column({ name: 'justificativa_cancelamento', type: 'text', nullable: true })
  justificativaCancelamento?: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}

export const CADASTRO_ENTITIES = [
  Funcao,
  Colaborador,
  Operacao,
  TipoOcorrencia,
  Fornecedor,
  Resina,
  LoteResina,
  MovimentoEstoqueLote,
  Item,
  Molde,
  ConfiguracaoItemMolde,
  OrdemProducao,
];
