import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PasswordService } from './password.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { AuthenticatedUser } from './jwt.strategy';

export interface LoginResult {
  accessToken: string;
  deveTrocarSenha: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async login(email: string, senha: string, correlationId?: string): Promise<LoginResult> {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .leftJoinAndSelect('usuario.perfis', 'perfis')
      .where('usuario.email = :email', { email })
      .andWhere('usuario.ativo = true')
      .getOne();

    // Mensagem genérica para não revelar se o e-mail existe (evita enumeração de contas).
    const credenciaisInvalidas = () => new UnauthorizedException('Credenciais inválidas');

    if (!usuario) {
      throw credenciaisInvalidas();
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte.getTime() > Date.now()) {
      throw new ForbiddenException('Usuário temporariamente bloqueado por tentativas inválidas');
    }

    const senhaValida = await this.passwordService.verify(usuario.senhaHash, senha);

    if (!senhaValida) {
      await this.registrarTentativaInvalida(usuario);
      throw credenciaisInvalidas();
    }

    usuario.tentativasLogin = 0;
    usuario.bloqueadoAte = null;
    usuario.ultimoLoginEm = new Date();
    await this.usuarioRepository.save(usuario);

    await this.auditoriaService.registrar({
      entidade: 'usuario',
      entidadeId: usuario.id,
      acao: 'UPDATE',
      usuarioId: usuario.id,
      dadosDepois: { evento: 'login_sucesso' },
      correlationId,
    });

    const perfis = (usuario.perfis ?? []).map((perfil) => perfil.codigo);
    const payload: AuthenticatedUser = {
      sub: usuario.id,
      empresaId: usuario.empresaId,
      email: usuario.email,
      perfis,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, deveTrocarSenha: usuario.deveTrocarSenha };
  }

  private async registrarTentativaInvalida(usuario: Usuario): Promise<void> {
    const maxTentativas = this.configService.get<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5);
    const minutosBloqueio = this.configService.get<number>('AUTH_LOCKOUT_MINUTES', 15);

    usuario.tentativasLogin += 1;

    if (usuario.tentativasLogin >= maxTentativas) {
      usuario.bloqueadoAte = new Date(Date.now() + minutosBloqueio * 60_000);
      usuario.tentativasLogin = 0;
    }

    await this.usuarioRepository.save(usuario);
  }

  async me(userId: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['perfis'],
    });
  }

  async changePassword(
    userId: string,
    senhaAtual: string,
    novaSenha: string,
    correlationId?: string,
  ): Promise<void> {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .where('usuario.id = :userId', { userId })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const senhaAtualValida = await this.passwordService.verify(usuario.senhaHash, senhaAtual);
    if (!senhaAtualValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    usuario.senhaHash = await this.passwordService.hash(novaSenha);
    usuario.deveTrocarSenha = false;
    await this.usuarioRepository.save(usuario);

    await this.auditoriaService.registrar({
      entidade: 'usuario',
      entidadeId: usuario.id,
      acao: 'UPDATE',
      usuarioId: usuario.id,
      dadosDepois: { evento: 'troca_senha' },
      correlationId,
    });
  }
}
