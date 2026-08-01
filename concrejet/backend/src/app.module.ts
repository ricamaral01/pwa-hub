import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './common/logger/logger.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizacaoModule } from './modules/organizacao/organizacao.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ProducaoBaseModule } from './modules/producao-base/producao-base.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { CadastrosModule } from './modules/cadastros/cadastros.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    HealthModule,
    AuthModule,
    OrganizacaoModule,
    UsuariosModule,
    ProducaoBaseModule,
    AuditoriaModule,
    CadastrosModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
