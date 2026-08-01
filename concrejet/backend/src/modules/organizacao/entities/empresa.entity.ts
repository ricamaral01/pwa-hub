import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Unidade } from './unidade.entity';

@Entity('empresa')
export class Empresa extends BaseEntity {
  @Column({ name: 'razao_social', type: 'varchar', length: 200 })
  razaoSocial!: string;

  @Index('uq_empresa_cnpj', { unique: true })
  @Column({ type: 'varchar', length: 14 })
  cnpj!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @OneToMany(() => Unidade, (unidade) => unidade.empresa)
  unidades?: Unidade[];
}
