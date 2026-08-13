import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Empresa } from './empresa.entity';

@Entity('unidade')
@Index('uq_unidade_empresa_codigo', ['empresa', 'codigo'], { unique: true })
export class Unidade extends BaseEntity {
  @ManyToOne(() => Empresa, (empresa) => empresa.unidades, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @Column({ type: 'varchar', length: 20 })
  codigo!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
