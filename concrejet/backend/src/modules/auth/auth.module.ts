import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Colaborador } from '../cadastros/entities';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { OperatorSessionGuard } from './operator-session.guard';
import { OperationalPermissionGuard } from './operational-permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Colaborador, Dispositivo]),
    AuditoriaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_ACCESS_TOKEN_TTL_SECONDS', 900),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtAuthGuard, OperatorSessionGuard, OperationalPermissionGuard],
  exports: [AuthService, JwtAuthGuard, OperatorSessionGuard, OperationalPermissionGuard, JwtModule],
})
export class AuthModule {}
