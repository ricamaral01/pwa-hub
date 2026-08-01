import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Empresa } from '../../organizacao/entities/empresa.entity';
import { Unidade } from '../../organizacao/entities/unidade.entity';
import { Perfil } from './perfil.entity';

@Entity('usuario')
@Index('uq_usuario_empresa_email', ['empresa', 'email'], { unique: true })
export class Usuario extends BaseEntity {
  @ManyToOne(() => Empresa, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId!: string;

  @ManyToOne(() => Unidade, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'unidade_id' })
  unidade?: Unidade;

  @Column({ name: 'unidade_id', nullable: true })
  unidadeId?: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255, select: false })
  senhaHash!: string;

  @Column({ name: 'deve_trocar_senha', type: 'boolean', default: true })
  deveTrocarSenha!: boolean;

  @Column({ name: 'tentativas_login', type: 'integer', default: 0 })
  tentativasLogin!: number;

  @Column({ name: 'bloqueado_ate', type: 'timestamptz', nullable: true })
  bloqueadoAte?: Date | null;

  @Column({ name: 'ultimo_login_em', type: 'timestamptz', nullable: true })
  ultimoLoginEm?: Date | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @ManyToMany(() => Perfil)
  @JoinTable({
    name: 'usuario_perfil',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'perfil_id', referencedColumnName: 'id' },
  })
  perfis?: Perfil[];
}
