import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Unidade } from '../../organizacao/entities/unidade.entity';

@Entity('maquina')
@Index('uq_maquina_unidade_codigo', ['unidade', 'codigo'], { unique: true })
export class Maquina extends BaseEntity {
  @ManyToOne(() => Unidade, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'unidade_id' })
  unidade!: Unidade;

  @Column({ name: 'unidade_id' })
  unidadeId!: string;

  @Column({ type: 'varchar', length: 30 })
  codigo!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  modelo?: string;

  @Column({ name: 'numero_serie', type: 'varchar', length: 80, nullable: true })
  numeroSerie?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  setor?: string;

  @Column({ type: 'integer', nullable: true })
  capacidade?: number;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
