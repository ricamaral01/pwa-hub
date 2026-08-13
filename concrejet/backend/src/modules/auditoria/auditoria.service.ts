import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';

export interface RegistrarAuditoriaInput {
  entidade: string;
  entidadeId: string;
  acao: 'CREATE' | 'UPDATE' | 'DELETE';
  usuarioId?: string | null;
  dadosAntes?: Record<string, unknown> | null;
  dadosDepois?: Record<string, unknown> | null;
  correlationId?: string | null;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async registrar(input: RegistrarAuditoriaInput): Promise<void> {
    const registro = this.auditoriaRepository.create(input);
    await this.auditoriaRepository.save(registro);
  }
}
