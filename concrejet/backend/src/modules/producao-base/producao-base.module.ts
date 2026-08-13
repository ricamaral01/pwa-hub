import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maquina } from './entities/maquina.entity';
import { Dispositivo } from './entities/dispositivo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Maquina, Dispositivo])],
  exports: [TypeOrmModule],
})
export class ProducaoBaseModule {}
