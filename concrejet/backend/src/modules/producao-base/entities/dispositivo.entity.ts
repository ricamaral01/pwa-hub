import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Maquina } from './maquina.entity';

@Entity('dispositivo')
export class Dispositivo extends BaseEntity {
  @ManyToOne(() => Maquina, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'maquina_id' })
  maquina?: Maquina;

  @Column({ name: 'maquina_id', nullable: true })
  maquinaId?: string;

  @Index('uq_dispositivo_identificador', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  identificador!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  @Column({ type: 'varchar', length: 40, name: 'tipo' })
  tipo!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
