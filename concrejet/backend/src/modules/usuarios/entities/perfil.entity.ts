import { Column, Entity, Index, ManyToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Empresa } from '../../organizacao/entities/empresa.entity';
import { Permissao } from './permissao.entity';

@Entity('perfil')
@Index('uq_perfil_empresa_codigo', ['empresa', 'codigo'], { unique: true })
export class Perfil extends BaseEntity {
  @ManyToOne(() => Empresa, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @Column({ type: 'varchar', length: 60 })
  codigo!: string;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @ManyToMany(() => Permissao, (permissao) => permissao.perfis)
  permissoes?: Permissao[];
}
