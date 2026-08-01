import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Empresa } from '../modules/organizacao/entities/empresa.entity';
import { Unidade } from '../modules/organizacao/entities/unidade.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';
import { Perfil } from '../modules/usuarios/entities/perfil.entity';
import { Permissao } from '../modules/usuarios/entities/permissao.entity';
import { Maquina } from '../modules/producao-base/entities/maquina.entity';
import { Dispositivo } from '../modules/producao-base/entities/dispositivo.entity';
import { Auditoria } from '../modules/auditoria/entities/auditoria.entity';
import { CADASTRO_ENTITIES } from '../modules/cadastros/entities';
import { Apontamento } from '../modules/producao/entities/apontamento.entity';
import { Ocorrencia } from '../modules/ocorrencias/entities/ocorrencia.entity';
import {
  Blenda,
  BlendaComponente,
  CalendarioTurno,
  EstoqueMovimento,
} from '../modules/estoque/entities';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DATABASE_HOST'),
    port: config.get<number>('DATABASE_PORT'),
    username: config.get<string>('DATABASE_USER'),
    password: config.get<string>('DATABASE_PASSWORD'),
    database: config.get<string>('DATABASE_NAME'),
    ssl: config.get<boolean>('DATABASE_SSL'),
    entities: [
      Empresa,
      Unidade,
      Usuario,
      Perfil,
      Permissao,
      Maquina,
      Dispositivo,
      Auditoria,
      ...CADASTRO_ENTITIES,
      Apontamento,
      Ocorrencia,
      EstoqueMovimento,
      Blenda,
      BlendaComponente,
      CalendarioTurno,
    ],
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
    synchronize: false,
    logging: config.get<string>('NODE_ENV') === 'development',
  };
}
