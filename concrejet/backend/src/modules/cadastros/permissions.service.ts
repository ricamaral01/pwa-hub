import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CadastroPermissionsService {
  constructor(private readonly dataSource: DataSource) {}

  async assertCan(usuarioId: string, chave: string): Promise<void> {
    const allowed = await this.dataSource.query(
      `
        select 1
        from usuario u
        join usuario_perfil up on up.usuario_id = u.id
        join perfil p on p.id = up.perfil_id and p.ativo = true
        join perfil_permissao pp on pp.perfil_id = p.id
        join permissao pe on pe.id = pp.permissao_id
        where u.id = $1
          and u.ativo = true
          and pe.chave in ($2, 'sistema.administrar')
        limit 1
      `,
      [usuarioId, chave],
    );

    if (!allowed.length) {
      throw new ForbiddenException('Permissao insuficiente para executar a operacao.');
    }
  }
}
