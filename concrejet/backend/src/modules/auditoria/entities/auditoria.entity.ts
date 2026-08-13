import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auditoria')
@Index('idx_auditoria_entidade', ['entidade', 'entidadeId'])
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  entidade!: string;

  @Column({ name: 'entidade_id', type: 'uuid' })
  entidadeId!: string;

  @Column({ type: 'varchar', length: 20 })
  acao!: 'CREATE' | 'UPDATE' | 'DELETE' | string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId?: string | null;

  @Column({ name: 'dados_antes', type: 'jsonb', nullable: true })
  dadosAntes?: Record<string, unknown> | null;

  @Column({ name: 'dados_depois', type: 'jsonb', nullable: true })
  dadosDepois?: Record<string, unknown> | null;

  @Column({ name: 'correlation_id', type: 'varchar', length: 100, nullable: true })
  correlationId?: string | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm!: Date;
}
