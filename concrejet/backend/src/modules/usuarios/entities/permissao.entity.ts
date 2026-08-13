import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Perfil } from './perfil.entity';

@Entity('permissao')
export class Permissao extends BaseEntity {
  @Index('uq_permissao_chave', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  chave!: string;

  @Column({ type: 'varchar', length: 150 })
  descricao!: string;

  @Column({ type: 'varchar', length: 60 })
  modulo!: string;

  @ManyToMany(() => Perfil, (perfil) => perfil.permissoes)
  @JoinTable({
    name: 'perfil_permissao',
    joinColumn: { name: 'permissao_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'perfil_id', referencedColumnName: 'id' },
  })
  perfis?: Perfil[];
}
