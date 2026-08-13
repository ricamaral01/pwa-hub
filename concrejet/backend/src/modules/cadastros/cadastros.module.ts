import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';
import { Maquina } from '../producao-base/entities/maquina.entity';
import { CadastrosController } from './cadastros.controller';
import { CadastrosService } from './cadastros.service';
import { CadastroPermissionsService } from './permissions.service';
import { CADASTRO_ENTITIES } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([...CADASTRO_ENTITIES, Maquina]), AuditoriaModule, AuthModule],
  controllers: [CadastrosController],
  providers: [CadastrosService, CadastroPermissionsService],
})
export class CadastrosModule {}
