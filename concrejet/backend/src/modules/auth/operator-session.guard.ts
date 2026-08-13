import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export interface OperationalUser {
  operadorId: string;
  dispositivoId: string;
  empresaId: string;
  unidadeId: string;
  maquinaId: string;
}

export interface OperationalRequest extends Request {
  operationalUser?: OperationalUser;
}

@Injectable()
export class OperatorSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<OperationalRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) throw new UnauthorizedException('Sessao operacional inexistente.');

    const session = await this.authService.validateOperatorSession(token);
    if (!session) throw new UnauthorizedException('Sessao operacional invalida ou expirada.');
    if (!session.maquinaId) throw new ForbiddenException('Dispositivo sem maquina vinculada.');
    req.operationalUser = session;
    return true;
  }
}
