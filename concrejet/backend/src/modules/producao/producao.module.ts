import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';
import {
  Colaborador,
  ConfiguracaoItemMolde,
  LoteResina,
  OrdemProducao,
} from '../cadastros/entities';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';
import { Apontamento } from './entities/apontamento.entity';
import { ProductionCalculationService } from './production-calculation.service';
import { ProductionCatalogController } from './production-catalog.controller';
import { ProductionCatalogService } from './production-catalog.service';
import { ProductionRecordsController } from './production-records.controller';
import { ProductionRecordsService } from './production-records.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Apontamento,
      Dispositivo,
      Colaborador,
      ConfiguracaoItemMolde,
      LoteResina,
      OrdemProducao,
    ]),
    AuditoriaModule,
    AuthModule,
  ],
  controllers: [ProductionRecordsController, ProductionCatalogController],
  providers: [ProductionRecordsService, ProductionCalculationService, ProductionCatalogService],
  exports: [ProductionCalculationService],
})
export class ProducaoModule {}
