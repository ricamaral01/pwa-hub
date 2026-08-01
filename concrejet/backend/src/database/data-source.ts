import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Empresa } from '../modules/organizacao/entities/empresa.entity';
import { Unidade } from '../modules/organizacao/entities/unidade.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';
import { Perfil } from '../modules/usuarios/entities/perfil.entity';
import { Permissao } from '../modules/usuarios/entities/permissao.entity';
import { Maquina } from '../modules/producao-base/entities/maquina.entity';
import { Dispositivo } from '../modules/producao-base/entities/dispositivo.entity';
import { Auditoria } from '../modules/auditoria/entities/auditoria.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true',
  entities: [Empresa, Unidade, Usuario, Perfil, Permissao, Maquina, Dispositivo, Auditoria],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
