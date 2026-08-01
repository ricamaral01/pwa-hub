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

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
