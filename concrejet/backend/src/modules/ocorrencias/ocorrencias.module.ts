import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';
import { CADASTRO_ENTITIES } from '../cadastros/entities';
import { Apontamento } from '../producao/entities/apontamento.entity';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';
import { Ocorrencia } from './entities/ocorrencia.entity';
import { OccurrencesController } from './occurrences.controller';
import { OccurrencesService } from './occurrences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ocorrencia, Apontamento, Dispositivo, ...CADASTRO_ENTITIES]),
    AuditoriaModule,
    AuthModule,
  ],
  controllers: [OccurrencesController],
  providers: [OccurrencesService],
  exports: [OccurrencesService],
})
export class OcorrenciasModule {}
