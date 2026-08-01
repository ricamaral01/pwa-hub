import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { OPERATIONAL_PERMISSION_KEY } from './require-operational-permission.decorator';
import type { OperationalRequest } from './operator-session.guard';

@Injectable()
export class OperationalPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string>(OPERATIONAL_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const req = context.switchToHttp().getRequest<OperationalRequest>();
    const user = req.operationalUser;
    if (!user) throw new ForbiddenException('Sessao operacional nao carregada.');

    const allowed = await this.dataSource.query(
      `
        select 1
        from colaborador c
        join funcao f on f.id = c.funcao_id and f.ativo = true
        join perfil p on p.empresa_id = c.empresa_id and p.codigo in ('OPERADOR', 'ADMIN') and p.ativo = true
        join perfil_permissao pp on pp.perfil_id = p.id
        join permissao pe on pe.id = pp.permissao_id
        where c.id = $1
          and c.empresa_id = $2
          and c.ativo = true
          and pe.chave in ($3, 'sistema.administrar')
        limit 1
      `,
      [user.operadorId, user.empresaId, permission],
    );

    if (!allowed.length) {
      throw new ForbiddenException('Permissao operacional insuficiente.');
    }
    return true;
  }
}
