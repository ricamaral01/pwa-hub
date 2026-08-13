import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Unidade } from './entities/unidade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, Unidade])],
  exports: [TypeOrmModule],
})
export class OrganizacaoModule {}
