import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Perfil } from './entities/perfil.entity';
import { Permissao } from './entities/permissao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Perfil, Permissao])],
  exports: [TypeOrmModule],
})
export class UsuariosModule {}
