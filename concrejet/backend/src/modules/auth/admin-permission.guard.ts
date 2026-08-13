import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import type { AuthenticatedUser } from './jwt.strategy';
import { ADMIN_PERMISSION_KEY } from './require-admin-permission.decorator';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Sessao administrativa nao carregada.');

    const allowed = await this.dataSource.query(
      `
        select 1
        from usuario u
        join usuario_perfil up on up.usuario_id = u.id
        join perfil p on p.id = up.perfil_id and p.ativo = true
        join perfil_permissao pp on pp.perfil_id = p.id
        join permissao pe on pe.id = pp.permissao_id
        where u.id = $1
          and u.empresa_id = $2
          and u.ativo = true
          and pe.chave in ($3, 'sistema.administrar')
        limit 1
      `,
      [user.sub, user.empresaId, permission],
    );

    if (!allowed.length) throw new ForbiddenException('Permissao administrativa insuficiente.');
    return true;
  }
}
