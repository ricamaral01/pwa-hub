import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';
import { LoteResina } from '../cadastros/entities';
import { BlendsController } from './blends.controller';
import { BlendsService } from './blends.service';
import { Blenda, BlendaComponente, CalendarioTurno, EstoqueMovimento } from './entities';
import { StockController } from './stock.controller';
import { StockMovementsService } from './stock-movements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstoqueMovimento,
      Blenda,
      BlendaComponente,
      CalendarioTurno,
      LoteResina,
    ]),
    AuditoriaModule,
    AuthModule,
  ],
  controllers: [StockController, BlendsController],
  providers: [StockMovementsService, BlendsService],
  exports: [StockMovementsService],
})
export class EstoqueModule {}
